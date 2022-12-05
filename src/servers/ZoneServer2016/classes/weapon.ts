export class Weapon {
    ammoCount = 0;
    reloadTimer?: NodeJS.Timeout;
    currentReloadCount = 0; // needed for reload packet to work every time
    constructor() {

    }
}