export interface WeaponProfile {
  name: string;
  lightReach: number;
  heavyReach: number;
  lightCooldown: number;
  heavyCooldown: number;
  heavyCost: number;
  parryWindow: number;
  technique: string;
}

const ashStaff: WeaponProfile = {
  name: "bastón de fresno",
  lightReach: 1.9,
  heavyReach: 2.1,
  lightCooldown: 0.65,
  heavyCooldown: 1.05,
  heavyCost: 35,
  parryWindow: 0.24,
  technique: "equilibrado en ataque y defensa",
};

const historicalWeapons: Record<number, WeaponProfile> = {
  8: {
    name: "gladius romano",
    lightReach: 2.05,
    heavyReach: 2.2,
    lightCooldown: 0.62,
    heavyCooldown: 0.98,
    heavyCost: 35,
    parryWindow: 0.27,
    technique: "parada precisa y corte cercano",
  },
  9: {
    name: "bastón de escriba",
    lightReach: 2.1,
    heavyReach: 2.2,
    lightCooldown: 0.65,
    heavyCooldown: 1.03,
    heavyCost: 34,
    parryWindow: 0.28,
    technique: "defensa larga entre mesas",
  },
  11: {
    name: "martillo de teselas",
    lightReach: 1.95,
    heavyReach: 2.15,
    lightCooldown: 0.68,
    heavyCooldown: 0.95,
    heavyCost: 32,
    parryWindow: 0.24,
    technique: "golpe fuerte rápido contra el custodio",
  },
  13: {
    name: "cuchillo de escriba",
    lightReach: 1.95,
    heavyReach: 2.1,
    lightCooldown: 0.54,
    heavyCooldown: 1,
    heavyCost: 36,
    parryWindow: 0.22,
    technique: "ataques ligeros rápidos",
  },
  15: {
    name: "bastón astrolábico",
    lightReach: 2.2,
    heavyReach: 2.3,
    lightCooldown: 0.68,
    heavyCooldown: 1.05,
    heavyCost: 31,
    parryWindow: 0.26,
    technique: "mantener distancia del vigilante",
  },
  17: {
    name: "martillo de cantero",
    lightReach: 1.95,
    heavyReach: 2.2,
    lightCooldown: 0.72,
    heavyCooldown: 1,
    heavyCost: 32,
    parryWindow: 0.23,
    technique: "golpe fuerte contra piedra expuesta",
  },
  19: {
    name: "bastón de curandera",
    lightReach: 2.1,
    heavyReach: 2.2,
    lightCooldown: 0.66,
    heavyCooldown: 1.02,
    heavyCost: 30,
    parryWindow: 0.3,
    technique: "parada amplia para proteger el registro",
  },
  21: {
    name: "palanca de prensa",
    lightReach: 2,
    heavyReach: 2.25,
    lightCooldown: 0.7,
    heavyCooldown: 1.02,
    heavyCost: 33,
    parryWindow: 0.24,
    technique: "golpe fuerte a distancia de la prensa",
  },
  23: {
    name: "estoque de archivo",
    lightReach: 2.25,
    heavyReach: 2.3,
    lightCooldown: 0.58,
    heavyCooldown: 1.05,
    heavyCost: 37,
    parryWindow: 0.24,
    technique: "estocada ligera de largo alcance",
  },
  25: {
    name: "llave mecánica",
    lightReach: 1.95,
    heavyReach: 2.1,
    lightCooldown: 0.6,
    heavyCooldown: 0.94,
    heavyCost: 32,
    parryWindow: 0.25,
    technique: "golpe fuerte rápido en la recuperación",
  },
  27: {
    name: "trípode de campaña",
    lightReach: 2.3,
    heavyReach: 2.4,
    lightCooldown: 0.72,
    heavyCooldown: 1.06,
    heavyCost: 30,
    parryWindow: 0.22,
    technique: "mantener la sombra fuera del revelado",
  },
};

export function weaponProfileForRoom(room: number): WeaponProfile {
  const firstRoom =
    room >= 9 && room <= 10
      ? 9
      : room >= 11
        ? room % 2 === 0
          ? room - 1
          : room
        : room;
  return historicalWeapons[firstRoom] ?? ashStaff;
}
