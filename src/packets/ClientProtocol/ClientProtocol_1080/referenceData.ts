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

import { packVehicleReferenceData, parseVehicleReferenceData } from "./shared";

export const referenceDataPackets: any = [
  ["ReferenceData.ItemClassDefinitions", 0x1701, {}],
  ["ReferenceData.ItemCategoryDefinitions", 0x1702, {}],
  [
    "ReferenceData.ClientProfileData",
    0x1703,
    {
      fields: [
        {
          name: "profiles",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "profileId", type: "uint32", defaultValue: 0 },
            {
              name: "profileData",
              type: "schema",
              fields: [
                { name: "profileId", type: "uint32", defaultValue: 0 },
                { name: "nameId", type: "uint32", defaultValue: 0 },
                { name: "descriptionId", type: "uint32", defaultValue: 0 },
                { name: "profileType", type: "uint32", defaultValue: 0 },
                { name: "iconId", type: "uint32", defaultValue: 0 },
                { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                { name: "unknownDword7", type: "uint32", defaultValue: 0 },
                { name: "unknownDword8", type: "uint32", defaultValue: 0 },
                { name: "unknownDword9", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownBoolean1",
                  type: "boolean",
                  defaultValue: false,
                },
                {
                  name: "unknownBoolean2",
                  type: "boolean",
                  defaultValue: false,
                },
                { name: "unknownDword10", type: "uint32", defaultValue: 0 },
                { name: "unknownDword11", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                  ],
                },
                { name: "firstPersonArms1", type: "uint32", defaultValue: 0 },
                { name: "firstPersonArms2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword14", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownArray2",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  ],
                },
                { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
                { name: "unknownFloat2", type: "float", defaultValue: 0.0 },
                { name: "unknownFloat3", type: "float", defaultValue: 0.0 },
                { name: "unknownFloat4", type: "float", defaultValue: 0.0 },
                { name: "unknownDword15", type: "uint32", defaultValue: 0 },
                { name: "unknownDword16", type: "uint32", defaultValue: 0 },
                { name: "unknownDword17", type: "uint32", defaultValue: 0 },
                { name: "imageSetId1", type: "uint32", defaultValue: 0 },
                { name: "imageSetId2", type: "uint32", defaultValue: 0 },
              ],
            },
          ],
        },
      ],
    },
  ],
  [
    "ReferenceData.WeaponDefinitions",
    0x1704,
    {
      fields: [{ name: "data", type: "byteswithlength" }],
    },
  ],
  ["ReferenceData.ProjectileDefinitions", 0x1705, {}],
  [
    "ReferenceData.VehicleDefinitions",
    0x1706,
    {
      fields: [
        {
          name: "data",
          type: "custom",
          parser: parseVehicleReferenceData,
          packer: packVehicleReferenceData,
        },
      ],
    },
  ],
];
