import { packVehicleReferenceData, parseVehicleReferenceData } from "./shared/shared";
import { profileDataSchema } from "./shared/shared";



export const referenceDataPackets:any = [
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
            defaultValue: [],
            fields: profileDataSchema,
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

]