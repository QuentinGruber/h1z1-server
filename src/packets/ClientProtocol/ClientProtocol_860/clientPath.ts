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

export const clientPathPackets: any = [
    [
        "ClientPathRequest",
        0x3e01,
        {
          fields: [],
        },
      ],
    [
        "ClientPathReply",
        0x3e02,
        {
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            {
              name: "unknownArray1",
              type: "array",
              defaultValue: [],
              fields: [
                {
                  name: "position",
                  type: "floatvector4",
                  defaultValue: [0, 0, 0, 0],
                },
              ],
            },
          ],
        },
      ],
  ];
  