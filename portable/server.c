#define _CRT_SECURE_NO_WARNINGS
#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <shellapi.h>
#include <direct.h>
#define CLOSE closesocket
#define PATH_SEP '\\'
typedef SOCKET socket_t;
#else
#include <arpa/inet.h>
#include <errno.h>
#include <limits.h>
#include <netinet/in.h>
#include <signal.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>
#define CLOSE close
#define INVALID_SOCKET (-1)
#define SOCKET_ERROR (-1)
#define PATH_SEP '/'
typedef int socket_t;
#endif
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define PORT 40404
#define MAX_PATH_SIZE 4096
static const char *url = "http://127.0.0.1:40404/";
static char root[MAX_PATH_SIZE];
static volatile int running = 1;

static void stop_server(int unused) { (void)unused; running = 0; }
#ifdef _WIN32
static BOOL WINAPI stop_console(DWORD event) {
  if (event == CTRL_C_EVENT || event == CTRL_BREAK_EVENT || event == CTRL_CLOSE_EVENT) {
    running = 0;
    return TRUE;
  }
  return FALSE;
}
#endif
static int send_all(socket_t sock, const char *data, size_t length) {
  while (length) {
    int n = send(sock, data, (int)(length > 65536 ? 65536 : length), 0);
    if (n <= 0) return 0;
    data += n;
    length -= (size_t)n;
  }
  return 1;
}
static void response(socket_t sock, int code, const char *type, const char *body, size_t length, int head) {
  char header[512];
  int count = snprintf(header, sizeof(header), "HTTP/1.1 %d %s\r\nContent-Type: %s\r\nContent-Length: %zu\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n", code, code == 200 ? "OK" : "Not Found", type, length);
  if (count > 0 && (size_t)count < sizeof(header)) send_all(sock, header, (size_t)count);
  if (!head && length) send_all(sock, body, length);
}
static int initialize(const char *folder) {
#ifdef _WIN32
  WSADATA ws;
  if (WSAStartup(MAKEWORD(2, 2), &ws)) return 0;
  DWORD n = GetFullPathNameA(folder, MAX_PATH_SIZE, root, NULL);
  if (!n || n >= MAX_PATH_SIZE) return 0;
#else
  if (!realpath(folder, root)) return 0;
#endif
  char index[MAX_PATH_SIZE];
  if (snprintf(index, sizeof(index), "%s%cindex.html", root, PATH_SEP) >= (int)sizeof(index)) return 0;
  FILE *file = fopen(index, "rb");
  if (!file) return 0;
  char html[8192];
  size_t size = fread(html, 1, sizeof(html) - 1, file);
  fclose(file);
  html[size] = 0;
  int assets = 0;
  for (char *at = html; (at = strstr(at, "./assets/")) != NULL;) {
    char *end = strchr(at, '"');
    if (!end || end - at > 512) return 0;
    char asset[MAX_PATH_SIZE];
    if (snprintf(asset, sizeof(asset), "%s%c%.*s", root, PATH_SEP, (int)(end - at), at) >= (int)sizeof(asset)) return 0;
    FILE *resource = fopen(asset, "rb");
    if (!resource) return 0;
    fclose(resource);
    assets++;
    at = end;
  }
  if (assets < 2) return 0;
  return 1;
}
static int probe(void) {
  socket_t sock = socket(AF_INET, SOCK_STREAM, 0);
  if (sock == INVALID_SOCKET) return 0;
  struct sockaddr_in addr;
  memset(&addr, 0, sizeof(addr));
  addr.sin_family = AF_INET;
  addr.sin_port = htons(PORT);
  addr.sin_addr.s_addr = htonl(0x7f000001);
  if (connect(sock, (struct sockaddr *)&addr, sizeof(addr)) == SOCKET_ERROR) { CLOSE(sock); return 0; }
  const char *request = "GET /__sanity404/health HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n";
  send_all(sock, request, strlen(request));
  char buffer[8192];
  size_t used = 0;
  int n;
  while (used < sizeof(buffer) - 1 && (n = recv(sock, buffer + used, (int)(sizeof(buffer) - 1 - used), 0)) > 0) used += (size_t)n;
  CLOSE(sock);
  buffer[used] = 0;
  char *body = strstr(buffer, "\r\n\r\n");
  return strncmp(buffer, "HTTP/1.1 200", 12) == 0 && body && strcmp(body + 4, root) == 0;
}
static int open_browser(void) {
#ifdef _WIN32
  return (INT_PTR)ShellExecuteA(NULL, "open", url, NULL, NULL, SW_SHOWNORMAL) > 32;
#else
  pid_t pid = fork();
  if (pid < 0) return 0;
  if (pid == 0) { execlp("xdg-open", "xdg-open", url, (char *)NULL); _exit(127); }
  return 1;
#endif
}
static const char *mime(const char *name) {
  const char *ext = strrchr(name, '.');
  if (!ext) return "application/octet-stream";
  if (!strcmp(ext, ".html")) return "text/html; charset=utf-8";
  if (!strcmp(ext, ".js")) return "text/javascript; charset=utf-8";
  if (!strcmp(ext, ".css")) return "text/css; charset=utf-8";
  if (!strcmp(ext, ".svg")) return "image/svg+xml";
  if (!strcmp(ext, ".webp")) return "image/webp";
  if (!strcmp(ext, ".png")) return "image/png";
  return "application/octet-stream";
}
static void handle(socket_t client) {
  char request[4096];
  int n = recv(client, request, sizeof(request) - 1, 0);
  if (n <= 0) return;
  request[n] = 0;
  char method[8], target[2048];
  if (sscanf(request, "%7s %2047s", method, target) != 2) return;
  int head = !strcmp(method, "HEAD");
  if (strcmp(method, "GET") && !head) { response(client, 404, "text/plain", "Not found", 9, 0); return; }
  char *query = strchr(target, '?');
  if (query) *query = 0;
  if (!strcmp(target, "/__sanity404/health")) { response(client, 200, "text/plain; charset=utf-8", root, strlen(root), head); return; }
  const char *relative = target[0] == '/' ? target + 1 : target;
  if (!*relative) relative = "index.html";
  if (strstr(relative, "..") || strchr(relative, '\\') || strchr(relative, '%') || strchr(relative, ':') || relative[0] == '.') { response(client, 404, "text/plain", "Not found", 9, head); return; }
  for (const char *p = relative; *p; p++) if (!((*p >= 'a' && *p <= 'z') || (*p >= 'A' && *p <= 'Z') || (*p >= '0' && *p <= '9') || *p == '/' || *p == '-' || *p == '_' || *p == '.')) { response(client, 404, "text/plain", "Not found", 9, head); return; }
  char path[MAX_PATH_SIZE];
  if (snprintf(path, sizeof(path), "%s%c%s", root, PATH_SEP, relative) >= (int)sizeof(path)) return;
  FILE *file = fopen(path, "rb");
  if (!file) { response(client, 404, "text/plain", "Not found", 9, head); return; }
  if (fseek(file, 0, SEEK_END) || ftell(file) < 0) { fclose(file); return; }
  long size = ftell(file);
  rewind(file);
  char *data = malloc((size_t)size + 1);
  if (!data) { fclose(file); return; }
  size_t read_count = fread(data, 1, (size_t)size, file);
  fclose(file);
  if (read_count == (size_t)size) response(client, 200, mime(relative), data, read_count, head);
  free(data);
}
int main(int argc, char **argv) {
  if (argc != 3 || (strcmp(argv[1], "--launch") && strcmp(argv[1], "--serve") && strcmp(argv[1], "--probe"))) {
    fprintf(stderr, "Uso: sanity404-server --launch|--serve|--probe <carpeta-game>\n"); return 2;
  }
  if (!initialize(argv[2])) { fprintf(stderr, "Faltan recursos del juego: %s/index.html\n", argv[2]); return 2; }
  if (!strcmp(argv[1], "--probe")) return probe() ? 0 : 1;
  socket_t listener = socket(AF_INET, SOCK_STREAM, 0);
  if (listener == INVALID_SOCKET) { perror("socket"); return 2; }
  struct sockaddr_in addr;
  memset(&addr, 0, sizeof(addr));
  addr.sin_family = AF_INET;
  addr.sin_port = htons(PORT);
  addr.sin_addr.s_addr = htonl(0x7f000001);
  if (bind(listener, (struct sockaddr *)&addr, sizeof(addr)) == SOCKET_ERROR) {
    CLOSE(listener);
    if (probe()) {
      puts("SANITY-404 ya está en ejecución con este paquete.");
      if (!strcmp(argv[1], "--launch") && !open_browser()) return 3;
      return 0;
    }
    fprintf(stderr, "No se puede usar 127.0.0.1:40404. Si el puerto está ocupado, cierre la otra aplicación; no se cambiará de origen.\n");
    return 3;
  }
  if (listen(listener, 16) == SOCKET_ERROR) { CLOSE(listener); return 2; }
#ifdef _WIN32
  SetConsoleCtrlHandler(stop_console, TRUE);
#else
  signal(SIGINT, stop_server);
  signal(SIGTERM, stop_server);
#endif
  printf("SANITY-404 listo en %s (Ctrl+C para detener)\n", url);
  fflush(stdout);
  if (!strcmp(argv[1], "--launch") && !open_browser()) fprintf(stderr, "No se pudo abrir el navegador. Abra manualmente %s\n", url);
  while (running) {
    fd_set ready;
    FD_ZERO(&ready);
    FD_SET(listener, &ready);
    struct timeval timeout = { 0, 500000 };
    int available = select((int)listener + 1, &ready, NULL, NULL, &timeout);
    if (available <= 0) continue;
    socket_t client = accept(listener, NULL, NULL);
    if (client == INVALID_SOCKET) { if (!running) break; continue; }
#ifdef _WIN32
    DWORD limit_ms = 3000;
    setsockopt(client, SOL_SOCKET, SO_RCVTIMEO, (const char *)&limit_ms, sizeof(limit_ms));
    setsockopt(client, SOL_SOCKET, SO_SNDTIMEO, (const char *)&limit_ms, sizeof(limit_ms));
#else
    struct timeval limit = { 3, 0 };
    setsockopt(client, SOL_SOCKET, SO_RCVTIMEO, &limit, sizeof(limit));
    setsockopt(client, SOL_SOCKET, SO_SNDTIMEO, &limit, sizeof(limit));
#endif
    handle(client);
    CLOSE(client);
  }
  CLOSE(listener);
#ifdef _WIN32
  WSACleanup();
#endif
  return 0;
}
