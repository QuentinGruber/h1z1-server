// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

export const definitionFilterPackets: any = [
  ["DefinitionFilter.ListDefinitionVariables", 0x9501, {}],
  [
    "DefinitionFilter.SetDefinitionVariable",
    0x9502,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
            { name: "unknownFloat2", type: "float", defaultValue: 0.0 }
          ]
        }
      ]
    }
  ],
  [
    "DefinitionFilter.SetDefinitionIntSet",
    0x9503,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
        {
          name: "unknownData1",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  [
    "DefinitionFilter.UnknownWithVariable1",
    0x9504,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" }
      ]
    }
  ],
  [
    "DefinitionFilter.UnknownWithVariable2",
    0x9505,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" }
      ]
    }
  ]
];
