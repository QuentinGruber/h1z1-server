import { ConstructorDeclaration } from "typescript";
import { Items } from "../models/enums";

interface SlotOffsets {
    yOffset: number
    authorizedItems: Array<number>
    offsets: Array<number>
    angles: Array<number>
    rotationOffsets: Array<number>
}


export type ConstructionSlots = { [itemDefId: number]: SlotOffsets };


export const foundationWallSlotDefinitions: ConstructionSlots = {
    [Items.GROUND_TAMPER]: {
        yOffset: 0.6542,
        authorizedItems: [Items.METAL_WALL, Items.METAL_GATE, Items.METAL_DOORWAY],
        offsets: [14.1421, 11.1803, 10, 11.1803, 14.1421, 11.1803, 10, 11.1803, 14.1421, 11.1803, 10, 11.1803, 14.1421, 11.1803, 10, 11.1803],
        angles: [-135.0000, -153.4349, 180, 153.4349, 135.0000, 116.5651, 90, 63.4349, 45.0000, 26.5651, 0, -26.5651, -45.0000, -63.4349, -90, -116.5651],
        rotationOffsets: [-1.5708, 0, 0, 0, 0, 1.5708, 1.5708, 1.5708, 1.5708, -3.1416, -3.1416, -3.1416, -3.1416, -1.5708, -1.5708, -1.5708]
    },
    [Items.FOUNDATION]: {
        yOffset: 2.1342,
        authorizedItems: [Items.METAL_WALL, Items.METAL_GATE, Items.METAL_DOORWAY],
        offsets: [10.4945, 7.7551, 7.7555, 10.4955, 7.8577, 7.9580, 10.7199, 8.0566, 8.0562, 10.7189, 7.9566, 7.8563],
        angles: [134.3902, 161.1994, -161.1892, -134.3846, -107.3354, -70.4827, -44.4030, -18.0830, 18.0731, 44.3974, 70.4792, 107.3386],
        rotationOffsets: [0, 0, 0, -1.5708, -1.5708, -1.5708, 3.1416, 3.1416, 3.1416, 1.5708, 1.5708, 1.5708]
    },
    [Items.FOUNDATION_EXPANSION]: {
        yOffset: 0.0055,
        authorizedItems: [Items.METAL_WALL, Items.METAL_GATE, Items.METAL_DOORWAY],
        offsets: [7.4945, 9.0134, 5.5896, 5.5899, 9.0139],
        angles: [0.6626, 33.6886, 63.4355, 116.5701, 146.3136],
        rotationOffsets: [-3.1416, 1.5708, 1.5708, 1.5708, 0]
    },
    [Items.SHACK_SMALL]: {
        yOffset: 0.8809,
        authorizedItems: [Items.DOOR_METAL, Items.DOOR_WOOD],
        offsets: [2.0476],
        angles: [126.6950],
        rotationOffsets: [0]
    },
    [Items.SHACK]: {
        yOffset: 0.8792,
        authorizedItems: [Items.DOOR_METAL, Items.DOOR_WOOD],
        offsets: [2.6662],
        angles: [154.4392],
        rotationOffsets: [0]
    },
    [Items.SHACK_BASIC]: {
        yOffset: -0.0126,
        authorizedItems: [Items.DOOR_BASIC],
        offsets: [0.9520],
        angles: [-173.1957],
        rotationOffsets: [0]
    }
}

export const foundationShelterSlotDefinitions: ConstructionSlots = {

}

export const foundationExpansionSlotDefinitions: ConstructionSlots = {
    [Items.FOUNDATION]: {
        yOffset: 2.1286,
        authorizedItems: [Items.FOUNDATION_EXPANSION],
        offsets: [7.5027, 7.3413, 7.5010, 7.6587],
        angles: [-88.7862, -179.9943, 88.7859, -0.0055],
        rotationOffsets: [3.1416, -1.5708, 0, 1.5708]
    }
}

export const foundationRampSlotDefinitions: ConstructionSlots = {
    [Items.FOUNDATION]: {
        yOffset: 2.1286,
        authorizedItems: [Items.FOUNDATION_RAMP, Items.FOUNDATION_STAIRS],
        offsets: [9.7044, 8.2095, 9.5351, 9.4750, 8.0488, 9.4759, 9.5286, 8.2186, 9.6937, 9.7424, 8.3611, 9.7417],
        angles: [57.7581, 88.8907, 120.5914, 148.1549, -179.9948, -148.1461, -120.5363, -88.8906, -57.8478, -30.8835, -0.0050, 30.8761],
        rotationOffsets: [-1.5708, -1.5708, -1.5708, 3.1416, 3.1416, 3.1416, 1.5708, 1.5708, 1.5708, 0, 0, 0]
    },
    [Items.FOUNDATION_EXPANSION]: {
        yOffset: 0.0003,
        authorizedItems: [Items.FOUNDATION_RAMP, Items.FOUNDATION_STAIRS],
        offsets: [8.5891, 7.6693, 5.6941, 7.6692, 8.5894],
        angles: [162.6863, 132.0595, 90.0025, 47.9419, 17.3132],
        rotationOffsets: [3.1416, -1.5708, -1.5708, -1.5708, 0]
    }
}