
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

export type remoteWeaponPacketsType = "RemoteWeapon.AddWeapon";

export type remoteWeaponUpdatePacketsType =
| "Update.ProjectileLaunch"
| "Update.Reload"
| "Update.AddFireGroup";