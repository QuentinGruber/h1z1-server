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