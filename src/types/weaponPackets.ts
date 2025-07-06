// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

export type weaponPacketsType =
  | "Weapon.FireStateUpdate"
  | "Weapon.FireStateTargetedUpdate"
  | "Weapon.Fire"
  | "Weapon.FireWithDefinitionMapping"
  | "Weapon.FireNoProjectile"
  | "Weapon.ProjectileHitReport"
  | "Weapon.ReloadRequest"
  | "Weapon.Reload"
  | "Weapon.ReloadInterrupt"
  | "Weapon.ReloadRejected"
  | "Weapon.SwitchFireModeRequest"
  | "Weapon.LockOnGuidUpdate"
  | "Weapon.LockOnLocationUpdate"
  | "Weapon.StatUpdate"
  | "Weapon.AddFireGroup"
  | "Weapon.RemoveFireGroup"
  | "Weapon.ReplaceFireGroup"
  | "Weapon.GuidedUpdate"
  | "Weapon.Reset";

export type remoteWeaponPacketsType =
  | "RemoteWeapon.Reset"
  | "RemoteWeapon.AddWeapon"
  | "RemoteWeapon.RemoveWeapon";

export type remoteWeaponUpdatePacketsType =
  | "Update.ProjectileLaunch"
  | "Update.Reload"
  | "Update.AddFireGroup"
  | "Update.FireState"
  | "Update.SwitchFireMode"
  | "Update.ReloadLoopEnd"
  | "Update.ReloadInterrupt"
  | "Update.AimBlocked"
  | "Update.Empty"
  | "Update.Chamber";
