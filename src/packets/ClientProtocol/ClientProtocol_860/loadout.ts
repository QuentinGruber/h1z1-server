// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

export const loadoutPackets: any = [
  ["Loadout.LoadLoadoutDefinitionManager", 0x8601, {}],
  ["Loadout.SelectLoadout", 0x8602, {}],
  [
    "Loadout.SetCurrentLoadout",
    0x8603,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "loadoutId", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  [
    "Loadout.SelectSlot",
    0x8604,
    {
      fields: [
        { name: "type", type: "uint8", defaultValue: 0 },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "unknownByte2", type: "uint8", defaultValue: 0 },
        { name: "loadoutSlotId", type: "uint32", defaultValue: 0 },
        { name: "gameTime", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Loadout.SelectClientSlot", 0x8605, {}],
  [
    "Loadout.SetCurrentSlot",
    0x8606,
    {
      fields: [
        { name: "type", type: "uint8", defaultValue: 0 },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "slotId", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Loadout.CreateCustomLoadout", 0x8607, {}],
  ["Loadout.SelectSlotItem", 0x8608, {}],
  ["Loadout.UnselectSlotItem", 0x8609, {}],
  ["Loadout.SelectSlotTintItem", 0x860a, {}],
  ["Loadout.UnselectSlotTintItem", 0x860b, {}],
  ["Loadout.SelectAllSlotTintItems", 0x860c, {}],
  ["Loadout.UnselectAllSlotTintItems", 0x860d, {}],
  ["Loadout.SelectBodyTintItem", 0x860e, {}],
  ["Loadout.UnselectBodyTintItem", 0x860f, {}],
  ["Loadout.SelectAllBodyTintItems", 0x8610, {}],
  ["Loadout.UnselectAllBodyTintItems", 0x8611, {}],
  ["Loadout.SelectGuildTintItem", 0x8612, {}],
  ["Loadout.UnselectGuildTintItem", 0x8613, {}],
  ["Loadout.SelectDecalItem", 0x8614, {}],
  ["Loadout.UnselectDecalItem", 0x8615, {}],
  ["Loadout.SelectAttachmentItem", 0x8616, {}],
  ["Loadout.UnselectAttachmentItem", 0x8617, {}],
  ["Loadout.SelectCustomName", 0x8618, {}],
  ["Loadout.ActivateLoadoutTerminal", 0x8619, {}],
  [
    "Loadout.ActivateVehicleLoadoutTerminal",
    0x861a,
    {
      fields: [
        { name: "type", type: "uint8", defaultValue: 0 },
        { name: "guid", type: "uint64string", defaultValue: "0" },
      ],
    },
  ],
  [
    "Loadout.SetLoadouts",
    0x861b,
    {
      fields: [
        { name: "type", type: "uint8", defaultValue: 0 },
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Loadout.AddLoadout", 0x861c, {}],
  ["Loadout.UpdateCurrentLoadout", 0x861d, {}],
  ["Loadout.UpdateLoadoutSlot", 0x861e, {}],
  ["Loadout.SetVehicleLoadouts", 0x861f, {}],
  ["Loadout.AddVehicleLoadout", 0x8620, {}],
  ["Loadout.ClearCurrentVehicleLoadout", 0x8621, {}],
  ["Loadout.UpdateVehicleLoadoutSlot", 0x8622, {}],
  ["Loadout.SetSlotTintItem", 0x8623, {}],
  ["Loadout.UnsetSlotTintItem", 0x8624, {}],
  ["Loadout.SetBodyTintItem", 0x8625, {}],
  ["Loadout.UnsetBodyTintItem", 0x8626, {}],
  ["Loadout.SetGuildTintItem", 0x8627, {}],
  ["Loadout.UnsetGuildTintItem", 0x8628, {}],
  ["Loadout.SetDecalItem", 0x8629, {}],
  ["Loadout.UnsetDecalItem", 0x862a, {}],
  ["Loadout.SetCustomName", 0x862b, {}],
  ["Loadout.UnsetCustomName", 0x862c, {}],
  ["Loadout.UpdateLoadoutSlotItemLineConfig", 0x862d, {}],
];
