import { Items } from "../models/enums";

interface SlotOffsets {
  yOffset: number;
  authorizedItems: Array<number>;
  offsets: Array<number>;
  angles: Array<number>;
  rotationOffsets: Array<number>;
}

export type ConstructionSlots = { [itemDefId: number]: SlotOffsets };

// ALL DOOR SLOTS ARE TREATED AS WALL SLOTS INTERNALLY FOR SIMPLICITY
export const wallSlotDefinitions: ConstructionSlots = {
  // #region FOUNDATION
  [Items.GROUND_TAMPER]: {
    yOffset: 0.6542,
    authorizedItems: [Items.METAL_WALL, Items.METAL_GATE, Items.METAL_DOORWAY],
    offsets: [
      14.1421, 11.1803, 10, 11.1803, 14.1421, 11.1803, 10, 11.1803, 14.1421,
      11.1803, 10, 11.1803, 14.1421, 11.1803, 10, 11.1803
    ],
    angles: [
      -135.0, -153.4349, 180, 153.4349, 135.0, 116.5651, 90, 63.4349, 45.0,
      26.5651, 0, -26.5651, -45.0, -63.4349, -90, -116.5651
    ],
    rotationOffsets: [
      -1.5708, 0, 0, 0, 0, 1.5708, 1.5708, 1.5708, 1.5708, -3.1416, -3.1416,
      -3.1416, -3.1416, -1.5708, -1.5708, -1.5708
    ]
  },
  [Items.FOUNDATION]: {
    yOffset: 2.1342,
    authorizedItems: [Items.METAL_WALL, Items.METAL_GATE, Items.METAL_DOORWAY],
    offsets: [
      10.4945, 7.7551, 7.7555, 10.4955, 7.8577, 7.958, 10.7199, 8.0566, 8.0562,
      10.7189, 7.9566, 7.8563
    ],
    angles: [
      134.3902, 161.1994, -161.1892, -134.3846, -107.3354, -70.4827, -44.403,
      -18.083, 18.0731, 44.3974, 70.4792, 107.3386
    ],
    rotationOffsets: [
      0, 0, 0, -1.5708, -1.5708, -1.5708, 3.1416, 3.1416, 3.1416, 1.5708,
      1.5708, 1.5708
    ]
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
    angles: [126.695],
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
    offsets: [0.952],
    angles: [-173.1957],
    rotationOffsets: [0]
  },

  // #endregion
  // #region SIMPLE
  [Items.SHELTER]: {
    yOffset: 0.0123,
    authorizedItems: [Items.DOOR_METAL, Items.DOOR_WOOD],
    offsets: [2.6534],
    angles: [154.2955],
    rotationOffsets: [0]
  },
  [Items.SHELTER_UPPER]: {
    yOffset: 0.0123,
    authorizedItems: [Items.DOOR_METAL, Items.DOOR_WOOD],
    offsets: [2.6534],
    angles: [154.2955],
    rotationOffsets: [0]
  },
  [Items.SHELTER_LARGE]: {
    yOffset: 0.0232,
    authorizedItems: [Items.DOOR_METAL, Items.DOOR_WOOD],
    offsets: [2.6821],
    angles: [153.6215],
    rotationOffsets: [0]
  },
  [Items.SHELTER_UPPER_LARGE]: {
    yOffset: 0.0232,
    authorizedItems: [Items.DOOR_METAL, Items.DOOR_WOOD],
    offsets: [2.6821],
    angles: [153.6215],
    rotationOffsets: [0]
  },
  [Items.LOOKOUT_TOWER]: {
    yOffset: 4.6086,
    authorizedItems: [Items.DOOR_METAL, Items.DOOR_WOOD],
    offsets: [0.6936],
    angles: [-47.5391],
    rotationOffsets: [1.5708]
  },
  [Items.METAL_DOORWAY]: {
    yOffset: 0.003,
    authorizedItems: [Items.DOOR_METAL, Items.DOOR_WOOD],
    offsets: [1.9911],
    angles: [-92.4737],
    rotationOffsets: [0]
  }
  // #endregion
};

export const upperWallSlotDefinitions: ConstructionSlots = {
  [Items.METAL_WALL]: {
    yOffset: 2.3817,
    authorizedItems: [Items.METAL_WALL_UPPER],
    offsets: [0],
    angles: [0],
    rotationOffsets: [0]
  },
  [Items.METAL_DOORWAY]: {
    yOffset: 2.3817,
    authorizedItems: [Items.METAL_WALL_UPPER],
    offsets: [0],
    angles: [0],
    rotationOffsets: [0]
  }
};

export const shelterSlotDefinitions: ConstructionSlots = {
  [Items.GROUND_TAMPER]: {
    yOffset: 0.6542,
    authorizedItems: [
      Items.SHELTER,
      Items.SHELTER_LARGE,
      Items.STRUCTURE_STAIRS,
      Items.LOOKOUT_TOWER
    ],
    offsets: [
      10.6066, 7.9057, 7.9057, 10.6066, 7.9057, 3.5355, 3.5355, 7.9057, 7.9057,
      3.5355, 3.5355, 7.9057, 10.6066, 7.9057, 7.9057, 10.6066
    ],
    angles: [
      135.0, 161.5651, -161.5651, -135.0, 108.4349, 135.0, -135.0, -108.4349,
      71.5651, 45.0, -45.0, -71.5651, 45.0, 18.4349, -18.4349, -45.0
    ],
    rotationOffsets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  [Items.FOUNDATION]: {
    yOffset: 2.1342,
    authorizedItems: [
      Items.SHELTER,
      Items.SHELTER_LARGE,
      Items.STRUCTURE_STAIRS,
      Items.LOOKOUT_TOWER
    ],
    offsets: [
      6.9603, 4.8413, 6.9592, 5.0032, 0.1587, 5.0018, 7.1847, 5.1587, 7.1836
    ],
    angles: [
      -134.072, -179.9913, 134.0804, -88.1824, -0.2644, 88.1819, -44.1092,
      -0.0081, 44.1008
    ],
    rotationOffsets: [0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  [Items.FOUNDATION_EXPANSION]: {
    yOffset: 0.0055,
    authorizedItems: [
      Items.SHELTER,
      Items.SHELTER_LARGE,
      Items.STRUCTURE_STAIRS,
      Items.LOOKOUT_TOWER
    ],
    //offsets: [5.6352, 2.5994, 5.6352],
    //angles: [27.2306, 90.0056, 152.7694],

    offsets: [5.5897, 2.4994, 5.5902],
    angles: [26.5606, 90.0056, 153.4417],

    rotationOffsets: [0, 0, 0]
  },
  [Items.SHELTER]: {
    yOffset: 2.541,
    authorizedItems: [
      Items.SHELTER_UPPER,
      Items.SHELTER_UPPER_LARGE,
      Items.STRUCTURE_STAIRS_UPPER
    ],
    offsets: [0],
    angles: [0],
    rotationOffsets: [0]
  },
  [Items.SHELTER_LARGE]: {
    yOffset: 2.541,
    authorizedItems: [
      Items.SHELTER_UPPER,
      Items.SHELTER_UPPER_LARGE,
      Items.STRUCTURE_STAIRS_UPPER
    ],
    offsets: [0, 4.9703],
    angles: [0, 90],
    rotationOffsets: [0, 0]
  }
};

export const foundationExpansionSlotDefinitions: ConstructionSlots = {
  [Items.FOUNDATION]: {
    yOffset: 2.1286,
    authorizedItems: [Items.FOUNDATION_EXPANSION],
    offsets: [7.5027, 7.3413, 7.501, 7.6587],
    angles: [-88.7862, -179.9943, 88.7859, -0.0055],
    rotationOffsets: [3.1416, -1.5708, 0, 1.5708]
  }
};

export const foundationRampSlotDefinitions: ConstructionSlots = {
  [Items.FOUNDATION]: {
    yOffset: 2.1286,
    authorizedItems: [Items.FOUNDATION_RAMP, Items.FOUNDATION_STAIRS],
    offsets: [
      9.7044, 8.2095, 9.5351, 9.475, 8.0488, 9.4759, 9.5286, 8.2186, 9.6937,
      9.7424, 8.3611, 9.7417
    ],
    angles: [
      57.7581, 88.8907, 120.5914, 148.1549, -179.9948, -148.1461, -120.5363,
      -88.8906, -57.8478, -30.8835, -0.005, 30.8761
    ],
    rotationOffsets: [
      -1.5708, -1.5708, -1.5708, 3.1416, 3.1416, 3.1416, 1.5708, 1.5708, 1.5708,
      0, 0, 0
    ]
  },
  [Items.FOUNDATION_EXPANSION]: {
    yOffset: 0.0003,
    authorizedItems: [Items.FOUNDATION_RAMP, Items.FOUNDATION_STAIRS],
    offsets: [8.5891, 7.6693, 5.6941, 7.6692, 8.5894],
    angles: [162.6863, 132.0595, 90.0025, 47.9419, 17.3132],
    rotationOffsets: [3.1416, -1.5708, -1.5708, -1.5708, 0]
  }
};
