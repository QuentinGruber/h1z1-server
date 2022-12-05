export class Weapon {
    ammoCount: number;
    reloadTimer?: NodeJS.Timeout;
    currentReloadCount = 0; // needed for reload packet to work every time
    constructor(ammoCount?: number) {
        this.ammoCount = ammoCount || 0;
    }
}