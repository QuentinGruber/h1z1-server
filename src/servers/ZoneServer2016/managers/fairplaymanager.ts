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

import { Collection } from "mongodb";
import {
  FairPlayValues,
  StanceFlags,
  FireHint,
  HitReport
} from "types/zoneserver";
import {
  CONNECTION_REJECTION_FLAGS,
  DB_COLLECTIONS
} from "../../../utils/enums";
import {
  decrypt,
  getCurrentServerTimeWrapper,
  getDistance,
  getDistance1d,
  getDistance2d,
  isPointNearLine,
  isPosInRadius,
  isPosInRadiusWithY,
  logClientActionToMongo,
  movePoint
} from "../../../utils/utils";
import { LoadoutItem } from "../classes/loadoutItem";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { BaseEntity } from "../entities/baseentity";
import { Vehicle2016 as Vehicle } from "../entities/vehicle";
import {
  ConstructionPermissionIds,
  WeaponDefinitionIds
} from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { FileHash } from "types/shared";

const encryptedData = require("../../../../data/2016/encryptedData/encryptedData.json"),
  fairPlayData = require("../../../../data/2016/encryptedData/fairPlayData.json"),
  //defaultHashes: Array<FileHash> = require("../../../../data/2016/dataSources/AllowedFileHashes.json");
  defaultHashes = [
    {
      file_name: "Assets_000.pack",
      crc32_hash: "33f93466"
    },
    {
      file_name: "Assets_001.pack",
      crc32_hash: "ac231b7a"
    },
    {
      file_name: "Assets_002.pack",
      crc32_hash: "401a05f1"
    },
    {
      file_name: "Assets_003.pack",
      crc32_hash: "17562648"
    },
    {
      file_name: "Assets_004.pack",
      crc32_hash: "5ad57f55"
    },
    {
      file_name: "Assets_005.pack",
      crc32_hash: "c4b64164"
    },
    {
      file_name: "Assets_006.pack",
      crc32_hash: "8407cce0"
    },
    {
      file_name: "Assets_007.pack",
      crc32_hash: "1f39ddfa"
    },
    {
      file_name: "Assets_008.pack",
      crc32_hash: "11c96004"
    },
    {
      file_name: "Assets_009.pack",
      crc32_hash: "9586b7f7"
    },
    {
      file_name: "Assets_010.pack",
      crc32_hash: "666ef17f"
    },
    {
      file_name: "Assets_011.pack",
      crc32_hash: "d91edc5e"
    },
    {
      file_name: "Assets_012.pack",
      crc32_hash: "af3f340d"
    },
    {
      file_name: "Assets_013.pack",
      crc32_hash: "2531b7cb"
    },
    {
      file_name: "Assets_014.pack",
      crc32_hash: "b68ed5e2"
    },
    {
      file_name: "Assets_015.pack",
      crc32_hash: "f9494062"
    },
    {
      file_name: "Assets_016.pack",
      crc32_hash: "b8db0f49"
    },
    {
      file_name: "Assets_017.pack",
      crc32_hash: "38fe2150"
    },
    {
      file_name: "Assets_018.pack",
      crc32_hash: "a0e14330"
    },
    {
      file_name: "Assets_019.pack",
      crc32_hash: "baa2f9d0"
    },
    {
      file_name: "Assets_020.pack",
      crc32_hash: "eb84b6b4"
    },
    {
      file_name: "Assets_021.pack",
      crc32_hash: "e65036eb"
    },
    {
      file_name: "Assets_022.pack",
      crc32_hash: "c6eff52b"
    },
    {
      file_name: "Assets_023.pack",
      crc32_hash: "a0b08c92"
    },
    {
      file_name: "Assets_024.pack",
      crc32_hash: "08bbfb75"
    },
    {
      file_name: "Assets_025.pack",
      crc32_hash: "c4aa882c"
    },
    {
      file_name: "Assets_026.pack",
      crc32_hash: "a3e916bd"
    },
    {
      file_name: "Assets_027.pack",
      crc32_hash: "ca5b94a2"
    },
    {
      file_name: "Assets_028.pack",
      crc32_hash: "9f553bed"
    },
    {
      file_name: "Assets_029.pack",
      crc32_hash: "4f802a08"
    },
    {
      file_name: "Assets_030.pack",
      crc32_hash: "362b77cf"
    },
    {
      file_name: "Assets_031.pack",
      crc32_hash: "b06caf55"
    },
    {
      file_name: "Assets_032.pack",
      crc32_hash: "1df6786c"
    },
    {
      file_name: "Assets_033.pack",
      crc32_hash: "97fc5d9c"
    },
    {
      file_name: "Assets_034.pack",
      crc32_hash: "18df4d95"
    },
    {
      file_name: "Assets_035.pack",
      crc32_hash: "ccadeec0"
    },
    {
      file_name: "Assets_036.pack",
      crc32_hash: "a5fdf120"
    },
    {
      file_name: "Assets_037.pack",
      crc32_hash: "8107a06d"
    },
    {
      file_name: "Assets_038.pack",
      crc32_hash: "eb547afa"
    },
    {
      file_name: "Assets_039.pack",
      crc32_hash: "998ec038"
    },
    {
      file_name: "Assets_040.pack",
      crc32_hash: "4c7c2435"
    },
    {
      file_name: "Assets_041.pack",
      crc32_hash: "8cc65b0b"
    },
    {
      file_name: "Assets_042.pack",
      crc32_hash: "95d7d497"
    },
    {
      file_name: "Assets_043.pack",
      crc32_hash: "668a7c2a"
    },
    {
      file_name: "Assets_044.pack",
      crc32_hash: "fa754b7c"
    },
    {
      file_name: "Assets_045.pack",
      crc32_hash: "a42a2461"
    },
    {
      file_name: "Assets_046.pack",
      crc32_hash: "caad644f"
    },
    {
      file_name: "Assets_047.pack",
      crc32_hash: "782aed0c"
    },
    {
      file_name: "Assets_048.pack",
      crc32_hash: "2e073c12"
    },
    {
      file_name: "Assets_049.pack",
      crc32_hash: "d38937ff"
    },
    {
      file_name: "Assets_050.pack",
      crc32_hash: "883ed88c"
    },
    {
      file_name: "Assets_051.pack",
      crc32_hash: "c68726e9"
    },
    {
      file_name: "Assets_052.pack",
      crc32_hash: "d7976b18"
    },
    {
      file_name: "Assets_053.pack",
      crc32_hash: "50f0f597"
    },
    {
      file_name: "Assets_054.pack",
      crc32_hash: "1ca52e45"
    },
    {
      file_name: "Assets_055.pack",
      crc32_hash: "262eb37c"
    },
    {
      file_name: "Assets_056.pack",
      crc32_hash: "ae3426eb"
    },
    {
      file_name: "Assets_057.pack",
      crc32_hash: "d68c06b9"
    },
    {
      file_name: "Assets_058.pack",
      crc32_hash: "a46f1ce5"
    },
    {
      file_name: "Assets_059.pack",
      crc32_hash: "73abedf2"
    },
    {
      file_name: "Assets_060.pack",
      crc32_hash: "a925a078"
    },
    {
      file_name: "Assets_061.pack",
      crc32_hash: "448d1f45"
    },
    {
      file_name: "Assets_062.pack",
      crc32_hash: "5d381625"
    },
    {
      file_name: "Assets_063.pack",
      crc32_hash: "6c273e19"
    },
    {
      file_name: "Assets_064.pack",
      crc32_hash: "2d2a652f"
    },
    {
      file_name: "Assets_065.pack",
      crc32_hash: "65eef030"
    },
    {
      file_name: "Assets_066.pack",
      crc32_hash: "9a519a27"
    },
    {
      file_name: "Assets_067.pack",
      crc32_hash: "427e00c1"
    },
    {
      file_name: "Assets_068.pack",
      crc32_hash: "30ac086b"
    },
    {
      file_name: "Assets_069.pack",
      crc32_hash: "73952228"
    },
    {
      file_name: "Assets_070.pack",
      crc32_hash: "b6764e3a"
    },
    {
      file_name: "Assets_071.pack",
      crc32_hash: "5ecdb9b3"
    },
    {
      file_name: "Assets_072.pack",
      crc32_hash: "07060caf"
    },
    {
      file_name: "Assets_073.pack",
      crc32_hash: "00b207cb"
    },
    {
      file_name: "Assets_074.pack",
      crc32_hash: "7962ee6e"
    },
    {
      file_name: "Assets_075.pack",
      crc32_hash: "716208c5"
    },
    {
      file_name: "Assets_076.pack",
      crc32_hash: "654f8cb5"
    },
    {
      file_name: "Assets_077.pack",
      crc32_hash: "35aa1327"
    },
    {
      file_name: "Assets_078.pack",
      crc32_hash: "d9e74a33"
    },
    {
      file_name: "Assets_079.pack",
      crc32_hash: "3cb7ca84"
    },
    {
      file_name: "Assets_080.pack",
      crc32_hash: "05fd3bd4"
    },
    {
      file_name: "Assets_081.pack",
      crc32_hash: "028b3690"
    },
    {
      file_name: "Assets_082.pack",
      crc32_hash: "67a2a675"
    },
    {
      file_name: "Assets_083.pack",
      crc32_hash: "85a32936"
    },
    {
      file_name: "Assets_084.pack",
      crc32_hash: "bc7cce22"
    },
    {
      file_name: "Assets_085.pack",
      crc32_hash: "0038057a"
    },
    {
      file_name: "Assets_086.pack",
      crc32_hash: "ea340a28"
    },
    {
      file_name: "Assets_087.pack",
      crc32_hash: "7670f08e"
    },
    {
      file_name: "Assets_088.pack",
      crc32_hash: "d13deffd"
    },
    {
      file_name: "Assets_089.pack",
      crc32_hash: "422d1816"
    },
    {
      file_name: "Assets_090.pack",
      crc32_hash: "e8538217"
    },
    {
      file_name: "Assets_091.pack",
      crc32_hash: "3e0988e9"
    },
    {
      file_name: "Assets_092.pack",
      crc32_hash: "a4252563"
    },
    {
      file_name: "Assets_093.pack",
      crc32_hash: "f93b9abf"
    },
    {
      file_name: "Assets_094.pack",
      crc32_hash: "c58dcf4a"
    },
    {
      file_name: "Assets_095.pack",
      crc32_hash: "d5bc7f1a"
    },
    {
      file_name: "Assets_096.pack",
      crc32_hash: "4010ad9a"
    },
    {
      file_name: "Assets_097.pack",
      crc32_hash: "88bb792a"
    },
    {
      file_name: "Assets_098.pack",
      crc32_hash: "a15e65f6"
    },
    {
      file_name: "Assets_099.pack",
      crc32_hash: "93c056aa"
    },
    {
      file_name: "Assets_100.pack",
      crc32_hash: "8f0d5569"
    },
    {
      file_name: "Assets_101.pack",
      crc32_hash: "22c9c21b"
    },
    {
      file_name: "Assets_102.pack",
      crc32_hash: "16f83140"
    },
    {
      file_name: "Assets_103.pack",
      crc32_hash: "c67d591a"
    },
    {
      file_name: "Assets_104.pack",
      crc32_hash: "72a107b2"
    },
    {
      file_name: "Assets_105.pack",
      crc32_hash: "262dae15"
    },
    {
      file_name: "Assets_106.pack",
      crc32_hash: "8108ed6f"
    },
    {
      file_name: "Assets_107.pack",
      crc32_hash: "6867f35f"
    },
    {
      file_name: "Assets_108.pack",
      crc32_hash: "ad88ce21"
    },
    {
      file_name: "Assets_109.pack",
      crc32_hash: "c4fb61d2"
    },
    {
      file_name: "Assets_110.pack",
      crc32_hash: "81562773"
    },
    {
      file_name: "Assets_111.pack",
      crc32_hash: "7a5a1cc3"
    },
    {
      file_name: "Assets_112.pack",
      crc32_hash: "190c075d"
    },
    {
      file_name: "Assets_113.pack",
      crc32_hash: "22394b77"
    },
    {
      file_name: "Assets_114.pack",
      crc32_hash: "35b36968"
    },
    {
      file_name: "Assets_115.pack",
      crc32_hash: "a268f321"
    },
    {
      file_name: "Assets_116.pack",
      crc32_hash: "47372670"
    },
    {
      file_name: "Assets_117.pack",
      crc32_hash: "e48b94fb"
    },
    {
      file_name: "Assets_118.pack",
      crc32_hash: "af5a7788"
    },
    {
      file_name: "Assets_119.pack",
      crc32_hash: "e6668eee"
    },
    {
      file_name: "Assets_120.pack",
      crc32_hash: "3bad0b54"
    },
    {
      file_name: "Assets_121.pack",
      crc32_hash: "ce4d1c71"
    },
    {
      file_name: "Assets_122.pack",
      crc32_hash: "ac135f0f"
    },
    {
      file_name: "Assets_123.pack",
      crc32_hash: "a59ff271"
    },
    {
      file_name: "Assets_124.pack",
      crc32_hash: "e4f94537"
    },
    {
      file_name: "Assets_125.pack",
      crc32_hash: "1d77e7b7"
    },
    {
      file_name: "Assets_126.pack",
      crc32_hash: "08e7f815"
    },
    {
      file_name: "Assets_127.pack",
      crc32_hash: "8d97af64"
    },
    {
      file_name: "Assets_128.pack",
      crc32_hash: "b8144271"
    },
    {
      file_name: "Assets_129.pack",
      crc32_hash: "2af3157a"
    },
    {
      file_name: "Assets_130.pack",
      crc32_hash: "a91a4c06"
    },
    {
      file_name: "Assets_131.pack",
      crc32_hash: "f9397e2a"
    },
    {
      file_name: "Assets_132.pack",
      crc32_hash: "8597b41a"
    },
    {
      file_name: "Assets_133.pack",
      crc32_hash: "aa5c49c0"
    },
    {
      file_name: "Assets_134.pack",
      crc32_hash: "3bd95b65"
    },
    {
      file_name: "Assets_135.pack",
      crc32_hash: "a650ecd8"
    },
    {
      file_name: "Assets_136.pack",
      crc32_hash: "9e44f974"
    },
    {
      file_name: "Assets_137.pack",
      crc32_hash: "a578322b"
    },
    {
      file_name: "Assets_138.pack",
      crc32_hash: "597cd4c6"
    },
    {
      file_name: "Assets_139.pack",
      crc32_hash: "4df651e2"
    },
    {
      file_name: "Assets_140.pack",
      crc32_hash: "645b9712"
    },
    {
      file_name: "Assets_141.pack",
      crc32_hash: "2bdf6931"
    },
    {
      file_name: "Assets_142.pack",
      crc32_hash: "97b28663"
    },
    {
      file_name: "Assets_143.pack",
      crc32_hash: "42a1590c"
    },
    {
      file_name: "Assets_144.pack",
      crc32_hash: "b050deaa"
    },
    {
      file_name: "Assets_145.pack",
      crc32_hash: "0211bab7"
    },
    {
      file_name: "Assets_146.pack",
      crc32_hash: "9fd51678"
    },
    {
      file_name: "Assets_147.pack",
      crc32_hash: "5d7f4c8e"
    },
    {
      file_name: "Assets_148.pack",
      crc32_hash: "4ba43240"
    },
    {
      file_name: "Assets_149.pack",
      crc32_hash: "5651769b"
    },
    {
      file_name: "Assets_150.pack",
      crc32_hash: "f1c6963d"
    },
    {
      file_name: "Assets_151.pack",
      crc32_hash: "5c70cb60"
    },
    {
      file_name: "Assets_152.pack",
      crc32_hash: "2b596bb0"
    },
    {
      file_name: "Assets_153.pack",
      crc32_hash: "d86ea263"
    },
    {
      file_name: "Assets_154.pack",
      crc32_hash: "09bf4c5a"
    },
    {
      file_name: "Assets_155.pack",
      crc32_hash: "a1e61220"
    },
    {
      file_name: "Assets_156.pack",
      crc32_hash: "7e90f8e8"
    },
    {
      file_name: "Assets_157.pack",
      crc32_hash: "8a59be98"
    },
    {
      file_name: "Assets_158.pack",
      crc32_hash: "24ac6c70"
    },
    {
      file_name: "Assets_159.pack",
      crc32_hash: "3cb4c107"
    },
    {
      file_name: "Assets_160.pack",
      crc32_hash: "db33be03"
    },
    {
      file_name: "Assets_161.pack",
      crc32_hash: "814b871c"
    },
    {
      file_name: "Assets_162.pack",
      crc32_hash: "54a981c1"
    },
    {
      file_name: "Assets_163.pack",
      crc32_hash: "fc59bb94"
    },
    {
      file_name: "Assets_164.pack",
      crc32_hash: "25fd2486"
    },
    {
      file_name: "Assets_165.pack",
      crc32_hash: "6dc52a7e"
    },
    {
      file_name: "Assets_166.pack",
      crc32_hash: "8625f189"
    },
    {
      file_name: "Assets_167.pack",
      crc32_hash: "a90af974"
    },
    {
      file_name: "Assets_168.pack",
      crc32_hash: "38916039"
    },
    {
      file_name: "Assets_169.pack",
      crc32_hash: "f1e982b1"
    },
    {
      file_name: "Assets_170.pack",
      crc32_hash: "2de60274"
    },
    {
      file_name: "Assets_171.pack",
      crc32_hash: "552d9573"
    },
    {
      file_name: "Assets_172.pack",
      crc32_hash: "b3802688"
    },
    {
      file_name: "Assets_173.pack",
      crc32_hash: "a7cdb1ac"
    },
    {
      file_name: "Assets_174.pack",
      crc32_hash: "17a4ca3d"
    },
    {
      file_name: "Assets_175.pack",
      crc32_hash: "00522471"
    },
    {
      file_name: "Assets_176.pack",
      crc32_hash: "51847862"
    },
    {
      file_name: "Assets_177.pack",
      crc32_hash: "13fdee28"
    },
    {
      file_name: "Assets_178.pack",
      crc32_hash: "459f7ce6"
    },
    {
      file_name: "Assets_179.pack",
      crc32_hash: "a0aad3b2"
    },
    {
      file_name: "Assets_180.pack",
      crc32_hash: "8d1fab3f"
    },
    {
      file_name: "Assets_181.pack",
      crc32_hash: "e0957785"
    },
    {
      file_name: "Assets_182.pack",
      crc32_hash: "4672bdc5"
    },
    {
      file_name: "Assets_183.pack",
      crc32_hash: "9c5b20be"
    },
    {
      file_name: "Assets_184.pack",
      crc32_hash: "4a80e1dc"
    },
    {
      file_name: "Assets_185.pack",
      crc32_hash: "d63bdca4"
    },
    {
      file_name: "Assets_186.pack",
      crc32_hash: "831faa69"
    },
    {
      file_name: "Assets_187.pack",
      crc32_hash: "3a9163de"
    },
    {
      file_name: "Assets_188.pack",
      crc32_hash: "9539b12a"
    },
    {
      file_name: "Assets_189.pack",
      crc32_hash: "5ca9bc39"
    },
    {
      file_name: "Assets_190.pack",
      crc32_hash: "ce07f81d"
    },
    {
      file_name: "Assets_191.pack",
      crc32_hash: "eaeaac05"
    },
    {
      file_name: "Assets_192.pack",
      crc32_hash: "0f5321ff"
    },
    {
      file_name: "Assets_193.pack",
      crc32_hash: "eb569d9d"
    },
    {
      file_name: "Assets_194.pack",
      crc32_hash: "dfe6e36b"
    },
    {
      file_name: "Assets_195.pack",
      crc32_hash: "ee58dce5"
    },
    {
      file_name: "Assets_196.pack",
      crc32_hash: "c639a4ff"
    },
    {
      file_name: "Assets_197.pack",
      crc32_hash: "46360688"
    },
    {
      file_name: "Assets_198.pack",
      crc32_hash: "25f83e62"
    },
    {
      file_name: "Assets_199.pack",
      crc32_hash: "e152d106"
    },
    {
      file_name: "Assets_200.pack",
      crc32_hash: "aa5465b3"
    },
    {
      file_name: "Assets_201.pack",
      crc32_hash: "c3033c33"
    },
    {
      file_name: "Assets_202.pack",
      crc32_hash: "4190f10b"
    },
    {
      file_name: "Assets_203.pack",
      crc32_hash: "c1d52fb5"
    },
    {
      file_name: "Assets_204.pack",
      crc32_hash: "7a561a1c"
    },
    {
      file_name: "Assets_205.pack",
      crc32_hash: "3bedbc34"
    },
    {
      file_name: "Assets_206.pack",
      crc32_hash: "6573d754"
    },
    {
      file_name: "Assets_207.pack",
      crc32_hash: "3caf2768"
    },
    {
      file_name: "Assets_208.pack",
      crc32_hash: "ea71c70b"
    },
    {
      file_name: "Assets_209.pack",
      crc32_hash: "b7c61881"
    },
    {
      file_name: "Assets_210.pack",
      crc32_hash: "92745820"
    },
    {
      file_name: "Assets_211.pack",
      crc32_hash: "5fcfbf63"
    },
    {
      file_name: "Assets_212.pack",
      crc32_hash: "cf07761d"
    },
    {
      file_name: "Assets_213.pack",
      crc32_hash: "0fb6dbff"
    },
    {
      file_name: "Assets_214.pack",
      crc32_hash: "bacf0580"
    },
    {
      file_name: "Assets_215.pack",
      crc32_hash: "72a27326"
    },
    {
      file_name: "Assets_216.pack",
      crc32_hash: "4ef91ffc"
    },
    {
      file_name: "Assets_217.pack",
      crc32_hash: "232f54b4"
    },
    {
      file_name: "Assets_218.pack",
      crc32_hash: "60e6feae"
    },
    {
      file_name: "Assets_219.pack",
      crc32_hash: "bb2aba37"
    },
    {
      file_name: "Assets_220.pack",
      crc32_hash: "f4fb12b9"
    },
    {
      file_name: "Assets_221.pack",
      crc32_hash: "405cd43f"
    },
    {
      file_name: "Assets_222.pack",
      crc32_hash: "f5812d31"
    },
    {
      file_name: "Assets_223.pack",
      crc32_hash: "9ecd4ce3"
    },
    {
      file_name: "Assets_224.pack",
      crc32_hash: "2ebd64e7"
    },
    {
      file_name: "Assets_225.pack",
      crc32_hash: "ed816f85"
    },
    {
      file_name: "Assets_226.pack",
      crc32_hash: "e3b6a329"
    },
    {
      file_name: "Assets_227.pack",
      crc32_hash: "0c6d8acb"
    },
    {
      file_name: "Assets_228.pack",
      crc32_hash: "607c2301"
    },
    {
      file_name: "Assets_229.pack",
      crc32_hash: "27755c48"
    },
    {
      file_name: "Assets_230.pack",
      crc32_hash: "b7dab77a"
    },
    {
      file_name: "Assets_231.pack",
      crc32_hash: "f38d518c"
    },
    {
      file_name: "Assets_232.pack",
      crc32_hash: "2947467b"
    },
    {
      file_name: "Assets_233.pack",
      crc32_hash: "3371b060"
    },
    {
      file_name: "Assets_234.pack",
      crc32_hash: "a7ccb42c"
    },
    {
      file_name: "Assets_235.pack",
      crc32_hash: "03fb3054"
    },
    {
      file_name: "Assets_236.pack",
      crc32_hash: "89bf0305"
    },
    {
      file_name: "Assets_237.pack",
      crc32_hash: "05a22730"
    },
    {
      file_name: "Assets_238.pack",
      crc32_hash: "bccb5044"
    },
    {
      file_name: "Assets_239.pack",
      crc32_hash: "6d4c8437"
    },
    {
      file_name: "Assets_240.pack",
      crc32_hash: "f706cfcc"
    },
    {
      file_name: "Assets_241.pack",
      crc32_hash: "c379688f"
    },
    {
      file_name: "Assets_242.pack",
      crc32_hash: "1f120001"
    },
    {
      file_name: "Assets_243.pack",
      crc32_hash: "f314fe69"
    },
    {
      file_name: "Assets_244.pack",
      crc32_hash: "c22cfa27"
    },
    {
      file_name: "Assets_245.pack",
      crc32_hash: "9362707c"
    },
    {
      file_name: "Assets_246.pack",
      crc32_hash: "73a3bfef"
    },
    {
      file_name: "Assets_247.pack",
      crc32_hash: "c3fa3834"
    },
    {
      file_name: "Assets_248.pack",
      crc32_hash: "ec4e1137"
    },
    {
      file_name: "Assets_249.pack",
      crc32_hash: "ad39ae80"
    },
    {
      file_name: "Assets_250.pack",
      crc32_hash: "d40c1c38"
    },
    {
      file_name: "Assets_251.pack",
      crc32_hash: "b30522de"
    },
    {
      file_name: "Assets_252.pack",
      crc32_hash: "1cbf0374"
    },
    {
      file_name: "Assets_253.pack",
      crc32_hash: "f7ebc353"
    },
    {
      file_name: "Assets_254.pack",
      crc32_hash: "84ea665f"
    },
    {
      file_name: "Assets_255.pack",
      crc32_hash: "560e6f4a"
    },
    {
      file_name: "Assets_256.pack",
      crc32_hash: "f9eca10a"
    }
  ];

// hardcode as workaround

export class FairPlayManager {
  _decryptKey: string = "";
  _fairPlayDecryptKey: string = "";
  _suspiciousList: string[] = [];
  fairPlayValues?: FairPlayValues;
  defaultHashes = defaultHashes;

  /** MANAGED BY CONFIGMANAGER - See defaultConfig.yaml for more information */
  useFairPlay!: boolean;
  maxPing!: number;
  acceptedRejectionTypes!: Array<CONNECTION_REJECTION_FLAGS>;
  useAssetValidation!: boolean;
  hashSubmissionTimeout!: number;
  allowedPacks!: Array<FileHash>;
  requiredPacks!: Array<FileHash>;

  decryptFairPlayValues() {
    if (this._decryptKey) {
      this._suspiciousList = encryptedData.map(
        (x: { iv: string; encryptedData: string }) =>
          decrypt(x, this._decryptKey)
      );
    }
    if (this._fairPlayDecryptKey && this.useFairPlay) {
      const decryptedData = fairPlayData.map(
        (x: { iv: string; encryptedData: string }) =>
          decrypt(x, this._fairPlayDecryptKey)
      );
      this.fairPlayValues = {
        defaultMaxProjectileSpeed: Number(decryptedData[0]),
        defaultMinProjectileSpeed: Number(decryptedData[1]),
        defaultMaxDistance: Number(decryptedData[2]),
        WEAPON_308: {
          maxSpeed: Number(decryptedData[3]),
          minSpeed: Number(decryptedData[4]),
          maxDistance: Number(decryptedData[5])
        },
        WEAPON_CROSSBOW: {
          maxSpeed: Number(decryptedData[6]),
          minSpeed: Number(decryptedData[7]),
          maxDistance: Number(decryptedData[8])
        },
        WEAPON_BOW_MAKESHIFT: {
          maxSpeed: Number(decryptedData[9]),
          minSpeed: Number(decryptedData[10]),
          maxDistance: Number(decryptedData[11])
        },
        WEAPON_BOW_RECURVE: {
          maxSpeed: Number(decryptedData[12]),
          minSpeed: Number(decryptedData[13]),
          maxDistance: Number(decryptedData[14])
        },
        WEAPON_BOW_WOOD: {
          maxSpeed: Number(decryptedData[15]),
          minSpeed: Number(decryptedData[16]),
          maxDistance: Number(decryptedData[17])
        },
        WEAPON_SHOTGUN: {
          maxSpeed: Number(decryptedData[18]),
          minSpeed: Number(decryptedData[19]),
          maxDistance: Number(decryptedData[20])
        },
        lastLoginDateAddVal: Number(decryptedData[21]),
        maxTimeDrift: Number(decryptedData[22]),
        maxSpeed: Number(decryptedData[23]),
        maxVerticalSpeed: Number(decryptedData[24]),
        speedWarnsNumber: Number(decryptedData[25]),
        maxTpDist: Number(decryptedData[26]),
        dotProductMin: Number(decryptedData[27]),
        dotProductMinShotgun: Number(decryptedData[28]),
        dotProductBlockValue: Number(decryptedData[29]),
        requiredFile: decryptedData[30],
        requiredString: decryptedData[31],
        requiredFile2: decryptedData[32],
        respawnCheckRange: Number(decryptedData[33]),
        respawnCheckTime: Number(decryptedData[34]),
        respawnCheckIterations: Number(decryptedData[35]),
        maxFlying: Number(decryptedData[36]),
        maxPositionDesync: Number(decryptedData[37]),
        maxFlaggedShots: Number(decryptedData[38])
      };
    }
  }

  async checkPlayerSpeed(
    server: ZoneServer2016,
    client: Client,
    sequenceTime: number,
    position: Float32Array
  ): Promise<boolean> {
    if (client.isAdmin || !this.fairPlayValues || !client.isSynced)
      return false;
    if (!server.isSaving) {
      if (
        client.isInAir &&
        position[1] - client.startLoc > this.fairPlayValues.maxFlying
      ) {
        let kick = true;
        for (const a in server._constructionFoundations) {
          if (
            server._constructionFoundations[a].getHasPermission(
              server,
              client.character.characterId,
              ConstructionPermissionIds.VISIT
            ) &&
            server._constructionFoundations[a].isInside(
              client.character.state.position
            )
          )
            kick = false;
        }
        for (const char in server._characters) {
          if (
            server._characters[char].characterId == client.character.characterId
          )
            continue;
          if (
            isPosInRadiusWithY(
              3,
              client.character.state.position,
              server._characters[char].state.position,
              4.5
            )
          )
            kick = false;
        }
        if (kick) {
          server.kickPlayer(client);
          server.sendAlertToAll(`FairPlay: kicking ${client.character.name}`);
          server.sendChatTextToAdmins(
            `FairPlay: ${
              client.character.name
            } has been kicked for possible flying by ${(
              position[1] - client.startLoc
            ).toFixed(2)} at [${position[0]} ${position[1]} ${position[2]}]`,
            false
          );
          return true;
        }
      }
      const distance = getDistance2d(client.oldPos.position, position);
      if (
        Number(client.character.lastLoginDate) +
          this.fairPlayValues.lastLoginDateAddVal <
        new Date().getTime()
      ) {
        const drift = Math.abs(
          sequenceTime - getCurrentServerTimeWrapper().getTruncatedU32()
        );
        if (drift > this.fairPlayValues.maxTimeDrift) {
          server.kickPlayer(client);
          server.sendAlertToAll(`FairPlay: kicking ${client.character.name}`);
          server.sendChatTextToAdmins(
            `FairPlay: ${client.character.name} has been kicked for sequence time drifting by ${drift}`,
            false
          );
          return true;
        }
        if (!client.isLoading && client.enableChecks) {
          if (distance > this.fairPlayValues.maxTpDist) {
            /*this.sendData(client, "ClientUpdate.UpdateLocation", {
              position: new Float32Array([...client.oldPos.position, 0]),
              triggerLoadingScreen: true,
              unknownByte1: 1,
            });
            client.isMovementBlocked = true;*/
            server.kickPlayer(client);
            server.sendChatTextToAdmins(
              `FairPlay: Kicking ${client.character.name} for suspected teleport by ${distance} from [${client.oldPos.position[0]} ${client.oldPos.position[1]} ${client.oldPos.position[2]}] to [${position[0]} ${position[1]} ${position[2]}]`,
              false
            );
            return true;
          }
        }
      }

      const speed =
        (distance / 1000 / (sequenceTime - client.oldPos.time)) * 3600000;
      const verticalSpeed =
        (getDistance1d(client.oldPos.position[1], position[1]) /
          1000 /
          (sequenceTime - client.oldPos.time)) *
        3600000;
      if (
        speed > this.fairPlayValues.maxSpeed &&
        verticalSpeed < this.fairPlayValues.maxVerticalSpeed
      ) {
        const avgPing = await server._gatewayServer.getSoeClientAvgPing(
          client.soeClientId
        );
        if (avgPing) {
          if (avgPing >= 250) return false;
        }
        client.speedWarnsNumber += 1;
      } else if (client.speedWarnsNumber > 0) {
        client.speedWarnsNumber -= 1;
      }
      if (client.speedWarnsNumber > this.fairPlayValues.speedWarnsNumber) {
        server.kickPlayer(client);
        client.speedWarnsNumber = 0;
        if (!server._soloMode) {
          logClientActionToMongo(
            server._db?.collection(DB_COLLECTIONS.FAIRPLAY) as Collection,
            client,
            server._worldId,
            { type: "SpeedHack" }
          );
        }
        server.sendAlertToAll(`FairPlay: kicking ${client.character.name}`);
        server.sendChatTextToAdmins(
          `FairPlay: ${client.character.name} has been kicking for speed hacking: ${speed} m/s at position [${position[0]} ${position[1]} ${position[2]}]`,
          false
        );
        return true;
      }
    }
    client.oldPos = { position: position, time: sequenceTime };
    return false;
  }

  async checkVehicleSpeed(
    server: ZoneServer2016,
    client: Client,
    sequenceTime: number,
    position: Float32Array,
    vehicle: Vehicle
  ): Promise<boolean> {
    if (client.isAdmin || !this.useFairPlay) return false;
    if (!server.isSaving) {
      const drift = Math.abs(
        sequenceTime - getCurrentServerTimeWrapper().getTruncatedU32()
      );
      if (drift > 10000) {
        server.kickPlayer(client);
        server.sendAlertToAll(`FairPlay: kicking ${client.character.name}`);
        server.sendChatTextToAdmins(
          `FairPlay: ${client.character.name} has been kicked for sequence time drifting in vehicle by ${drift}`,
          false
        );
        return true;
      }
      const distance = getDistance2d(vehicle.oldPos.position, position);
      const speed =
        (distance / 1000 / (sequenceTime - vehicle.oldPos.time)) * 3600000;
      const verticalSpeed =
        (getDistance1d(vehicle.oldPos.position[1], position[1]) /
          1000 /
          (sequenceTime - vehicle.oldPos.time)) *
        3600000;

      if (speed > 130 && verticalSpeed < 20) {
        const avgPing = await server._gatewayServer.getSoeClientAvgPing(
          client.soeClientId
        );
        if (avgPing) {
          if (avgPing >= 250) return false;
        }
        client.speedWarnsNumber += 1;
      } else if (client.speedWarnsNumber > 0) {
        client.speedWarnsNumber -= 1;
      }
      if (client.speedWarnsNumber > 5) {
        server.kickPlayer(client);
        client.speedWarnsNumber = 0;
        if (!server._soloMode) {
          logClientActionToMongo(
            server._db?.collection(DB_COLLECTIONS.FAIRPLAY) as Collection,
            client,
            server._worldId,
            { type: "SpeedHack" }
          );
        }
        server.sendAlertToAll(`FairPlay: kicking ${client.character.name}`);
        server.sendChatTextToAdmins(
          `FairPlay: ${client.character.name} has been kicking for vehicle speed hacking: ${speed} m/s at position [${position[0]} ${position[1]} ${position[2]}]`,
          false
        );
        return true;
      }
    }
    return false;
  }

  hitMissFairPlayCheck(
    server: ZoneServer2016,
    client: Client,
    hit: boolean,
    hitLocation: string
  ) {
    const weaponItem = client.character.getEquippedWeapon();
    if (!weaponItem) return;
    const itemDefinition = server.getItemDefinition(
      weaponItem.itemDefinitionId
    );
    if (!itemDefinition) return;
    const weaponDefinitionId = itemDefinition.PARAM1;
    if (
      !this.useFairPlay ||
      !weaponItem ||
      weaponDefinitionId == WeaponDefinitionIds.WEAPON_SHOTGUN
    ) {
      return;
    }
    if (hit) {
      client.pvpStats.shotsHit += 1;
      switch (hitLocation.toLowerCase()) {
        case "head":
        case "glasses":
        case "neck":
          client.pvpStats.head += 1;
          break;
        case "spineupper":
        case "spinelower":
        case "spinemiddle":
          client.pvpStats.spine += 1;
          break;
        case "l_hip":
        case "r_hip":
        case "l_knee":
        case "r_knee":
        case "l_ankle":
        case "r_ankle":
          client.pvpStats.legs += 1;
          break;
        case "l_elbow":
        case "r_elbow":
        case "r_shoulder":
        case "l_shoulder":
        case "r_wrist":
        case "l_wrist":
          client.pvpStats.hands += 1;
          break;
        default:
          break;
      }
      const hitRatio =
        (100 * client.pvpStats.shotsHit) / client.pvpStats.shotsFired;
      if (client.pvpStats.shotsFired > 10 && hitRatio > 80) {
        if (!server._soloMode) {
          logClientActionToMongo(
            server._db?.collection(DB_COLLECTIONS.FAIRPLAY) as Collection,
            client,
            server._worldId,
            {
              type: "exceeds hit/miss ratio",
              hitRatio,
              totalShotsFired: client.pvpStats.shotsFired
            }
          );
        }
        server.sendChatTextToAdmins(
          `FairPlay: ${
            client.character.name
          } exceeds hit/miss ratio (${hitRatio.toFixed(4)}% of ${
            client.pvpStats.shotsFired
          } shots fired)`,
          false
        );
      }
    } else {
      client.pvpStats.shotsFired += 1;
    }
  }

  validateProjectileHit(
    server: ZoneServer2016,
    client: Client,
    entity: BaseEntity,
    fireHint: FireHint,
    weaponItem: LoadoutItem,
    hitReport: HitReport,
    gameTime: number
  ): boolean {
    if (!this.fairPlayValues) return true;
    const message = `[${Date.now()}] FairPlay: Blocked incoming projectile from ${
        client.character.name
      }`,
      targetClient = server.getClientByCharId(entity.characterId);

    if (targetClient) fireHint.hitNumber++;
    const checkWeapons = [
      WeaponDefinitionIds.WEAPON_BOW_MAKESHIFT,
      WeaponDefinitionIds.WEAPON_BOW_RECURVE,
      WeaponDefinitionIds.WEAPON_BOW_WOOD,
      WeaponDefinitionIds.WEAPON_CROSSBOW
    ];
    if (!weaponItem) return false;
    const itemDefinition = server.getItemDefinition(
      weaponItem.itemDefinitionId
    );
    if (!itemDefinition) return false;
    const weaponDefinitionId = itemDefinition.PARAM1;
    if (checkWeapons.includes(weaponDefinitionId)) {
      if (
        !fireHint.marked ||
        fireHint.marked.characterId != entity.characterId ||
        getDistance(fireHint.marked.position, hitReport.position) > 0.1 ||
        Math.abs(gameTime - fireHint.marked.gameTime) > 5
      ) {
        if (targetClient) {
          server.sendChatTextToAdmins(
            `FairPlay: ${client.character.name} is hitting invalid projectiles on player ${targetClient.character.name}`,
            false
          );
          server.sendConsoleText(targetClient, message);
        }
        return false;
      }
    }
    /*const angle = getAngle(fireHint.position, packet.hitReport.position);
      const fixedRot = (fireHint.rotation + 2 * Math.PI) % (2 * Math.PI);
      const dotProduct =
        Math.cos(angle) * Math.cos(fixedRot) +
        Math.sin(angle) * Math.sin(fixedRot);
      if (
        dotProduct <
        (weaponDefinitionId == WeaponDefinitionIds.WEAPON_SHOTGUN
          ? this.fairPlayValues.dotProductMinShotgun
          : this.fairPlayValues.dotProductMin)
      ) {
        if (dotProduct < this.fairPlayValues.dotProductBlockValue) {
          if (c) {
            this.sendConsoleText(c, message);
          }
          this.sendChatTextToAdmins(
            `FairPlay: ${
              client.character.name
            } projectile was blocked due to invalid rotation: ${Number(
              ((1 - dotProduct) * 100).toFixed(2)
            )} / ${
              Number(
                (1 - this.fairPlayValues.dotProductBlockValue).toFixed(3)
              ) * 100
            }% max deviation`,
            false
          );
          return;
        }

        this.sendChatTextToAdmins(
          `FairPlay: ${
            client.character.name
          } projectile is hitting with possible invalid rotation: ${Number(
            ((1 - dotProduct) * 100).toFixed(2)
          )} / ${
            Number(
              (
                1 -
                (weaponDefinitionId == WeaponDefinitionIds.WEAPON_SHOTGUN
                  ? this.fairPlayValues.dotProductMinShotgun
                  : this.fairPlayValues.dotProductMin)
              ).toFixed(3)
            ) * 100
          }% max deviation`,
          false
        );
      }*/

    if (targetClient) {
      if (!targetClient.vehicle.mountedVehicle) {
        if (
          getDistance(
            targetClient.character.state.position,
            hitReport.position
          ) > this.fairPlayValues.maxPositionDesync
        ) {
          server.sendChatTextToAdmins(
            `FairPlay: ${targetClient.character.name} shot has been blocked due to position desync`,
            false
          );
          server.sendConsoleText(targetClient, message);
          return false;
        }
      }
      const distance = getDistance(fireHint.position, hitReport.position);
      const speed =
        (distance / 1000 / (gameTime - fireHint.timeStamp)) * 3600000;
      let maxSpeed = this.fairPlayValues.defaultMaxProjectileSpeed;
      let minSpeed = this.fairPlayValues.defaultMinProjectileSpeed;
      let maxDistance = this.fairPlayValues.defaultMaxDistance;
      switch (weaponDefinitionId) {
        case WeaponDefinitionIds.WEAPON_308:
        case WeaponDefinitionIds.WEAPON_REAPER:
          maxSpeed = this.fairPlayValues.WEAPON_308.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_308.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_308.maxDistance;
          break;
        case WeaponDefinitionIds.WEAPON_CROSSBOW:
          maxSpeed = this.fairPlayValues.WEAPON_CROSSBOW.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_CROSSBOW.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_CROSSBOW.maxDistance;
          break;
        case WeaponDefinitionIds.WEAPON_BOW_MAKESHIFT:
          maxSpeed = this.fairPlayValues.WEAPON_BOW_MAKESHIFT.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_BOW_MAKESHIFT.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_BOW_MAKESHIFT.maxDistance;
          break;
        case WeaponDefinitionIds.WEAPON_BOW_RECURVE:
          maxSpeed = this.fairPlayValues.WEAPON_BOW_RECURVE.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_BOW_RECURVE.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_BOW_RECURVE.maxDistance;
          break;
        case WeaponDefinitionIds.WEAPON_BOW_WOOD:
          maxSpeed = this.fairPlayValues.WEAPON_BOW_WOOD.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_BOW_WOOD.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_BOW_WOOD.maxDistance;
          break;
        case WeaponDefinitionIds.WEAPON_SHOTGUN:
        case WeaponDefinitionIds.WEAPON_NAGAFENS_RAGE:
          maxSpeed = this.fairPlayValues.WEAPON_SHOTGUN.maxSpeed;
          minSpeed = this.fairPlayValues.WEAPON_SHOTGUN.minSpeed;
          maxDistance = this.fairPlayValues.WEAPON_SHOTGUN.maxDistance;
      }
      let block = false;
      if (distance > maxDistance && speed < minSpeed) block = true;
      if (
        distance > maxDistance &&
        (speed > maxSpeed ||
          speed < minSpeed ||
          speed <= 0 ||
          speed == Infinity)
      )
        block = true;
      if (block) {
        server.sendChatTextToAdmins(
          `FairPlay: prevented ${
            client.character.name
          }'s projectile from hitting ${
            targetClient.character.name
          } | speed: (${speed.toFixed(
            0
          )} / ${minSpeed}:${maxSpeed}) | ${distance.toFixed(2)}m | ${
            server.getItemDefinition(weaponItem.itemDefinitionId)?.NAME
          } | ${hitReport.hitLocation}`,
          false
        );
        server.sendConsoleText(targetClient, message);
        return false;
      }
    }
    return true;
  }

  checkAimVector(server: ZoneServer2016, client: Client, orientation: number) {
    if (client.character.weaponStance != 2) return;
    for (const a in server._characters) {
      const char = server._characters[a];
      if (client.character.name == char.name) continue;
      const fixedOrientation =
        orientation < 0
          ? orientation * (180.0 / Math.PI) + 360
          : orientation * (180.0 / Math.PI);
      const fixedPosUpdOrientation =
        char.positionUpdate?.orientation < 0
          ? char.positionUpdate?.orientation * (180.0 / Math.PI) + 360
          : char.positionUpdate?.orientation * (180.0 / Math.PI);
      const distance = getDistance(
        char.state.position,
        client.character.state.position
      );
      if (
        !isPosInRadius(
          char.npcRenderDistance,
          client.character.state.position,
          char.state.position
        ) ||
        distance <= 4
      )
        continue;
      if (
        Math.abs(fixedOrientation - fixedPosUpdOrientation) < 15 ||
        Math.abs(fixedOrientation - fixedPosUpdOrientation) > 345 ||
        (Math.abs(fixedOrientation - fixedPosUpdOrientation) > 165 &&
          Math.abs(fixedOrientation - fixedPosUpdOrientation) < 195)
      ) {
        continue;
      }

      const fixedCharPos = movePoint(
        char.state.position,
        char.positionUpdate?.orientation * -1 + 1.570795,
        -1
      );

      const startpoint = movePoint(
        client.character.state.position,
        orientation * -1 + 1.570795,
        1
      );
      const nextpoint = movePoint(
        client.character.state.position,
        orientation * -1 + 1.570795,
        200
      );
      if (
        isPointNearLine(
          new Float32Array([fixedCharPos[0], fixedCharPos[2]]),
          new Float32Array([startpoint[0], startpoint[2]]),
          new Float32Array([nextpoint[0], nextpoint[2]]),
          0.3
        )
      ) {
        client.character.aimVectorWarns += 1;
        if (client.character.aimVectorWarns >= 3) {
          server.sendChatTextToAdmins(
            `[FairPlay] ${client.character.name} possible aimlock [warns: ${client.character.aimVectorWarns}, distance: ${distance}`
          );
        }
      } else {
        client.character.aimVectorWarns = 0;
      }
    }
  }

  detectJumpXSMovement(
    server: ZoneServer2016,
    client: Client,
    stanceFlags: StanceFlags
  ) {
    if (stanceFlags.SITTING && stanceFlags.JUMPING) {
      const pos = client.character.state.position;
      if (!server._soloMode) {
        logClientActionToMongo(
          server._db?.collection(DB_COLLECTIONS.FAIRPLAY) as Collection,
          client,
          server._worldId,
          { type: "XS glitching", pos }
        );
      }
      server.sendChatTextToAdmins(
        `FairPlay: Possible XS glitching detected by ${client.character.name} at position [${pos[0]} ${pos[1]} ${pos[2]}]`
      );
      server.sendData(client, "ClientUpdate.UpdateLocation", {
        position: pos,
        triggerLoadingScreen: true
      });
    }
  }
  detectDroneMovement(
    server: ZoneServer2016,
    client: Client,
    stanceFlags: StanceFlags
  ) {
    if (stanceFlags.SITTING) {
      if (Date.now() - client.character.lastSitTime <= 200) {
        client.character.sitCount++;
      } else {
        client.character.sitCount = 0;
        client.character.lastSitTime = 0;
      }
      client.character.lastSitTime = Date.now();
      if (client.character.sitCount >= 10) {
        const pos = client.character.state.position;
        if (!server._soloMode) {
          logClientActionToMongo(
            server._db?.collection(DB_COLLECTIONS.FAIRPLAY) as Collection,
            client,
            server._worldId,
            { type: "Drone exploit", pos }
          );
        }
        server.sendChatTextToAdmins(
          `FairPlay: Possible drone exploit detected by ${client.character.name} at position [${pos[0]} ${pos[1]} ${pos[2]}]`
        );
        server.sendData(client, "ClientUpdate.UpdateLocation", {
          position: pos,
          triggerLoadingScreen: true
        });
        client.character.sitCount = 0;
      }
    }
  }

  handleAssetValidationInit(server: ZoneServer2016, client: Client) {
    const hashes = this.defaultHashes.concat(this.requiredPacks),
      validatedHashes: Array<FileHash> = [];
    console.log(JSON.stringify(hashes, null, 2)); // more debug
    if (!this.useAssetValidation || server._soloMode || client.isAdmin) return;

    server.sendData(client, "H1emu.RequestAssetHashes", {});
    server.sendData(client, "UpdateWeatherData", server.weatherManager.weather);
    server.sendConsoleText(client, "[SERVER] Requested asset hashes");

    client.kickTimer = setTimeout(() => {
      if (!client) return;
      server.kickPlayerWithReason(client, "Missing asset integrity check.");
    }, this.hashSubmissionTimeout);
  }

  validateFile(file1: FileHash, file2: FileHash) {
    return (
      file1.file_name == file2.file_name && file1.crc32_hash == file2.crc32_hash
    );
  }

  handleAssetCheck(server: ZoneServer2016, client: Client, data: string) {
    if (!this.useAssetValidation || server._soloMode) return;
    const receivedHashes: Array<FileHash> = JSON.parse(data);

    if (!receivedHashes || !Array.isArray(receivedHashes)) {
      console.log(
        `${client.loginSessionId} failed asset integrity check due to invalid JSON data.`
      );
      server.kickPlayerWithReason(
        client,
        "Failed asset integrity check - Invalid JSON Received"
      );
      return;
    }

    const hashes = this.defaultHashes.concat(this.requiredPacks),
      validatedHashes: Array<FileHash> = [];

    // check if all default / required packs are found in game files
    for (const value of hashes) {
      if (!value) continue;
      let received: FileHash | undefined;
      if (
        receivedHashes.find((clientValue) => {
          received = clientValue;
          return this.validateFile(value, clientValue);
        })
      ) {
        validatedHashes.push(value);
        continue;
      }
      console.log(
        `${client.loginSessionId} (${client.character.name}) failed asset integrity check due to missing or invalid file ${value.file_name} received: ${received?.crc32_hash} expected: ${value.crc32_hash}`
      );
      server.kickPlayerWithReason(
        client,
        `Failed asset integrity check - Missing or invalid file: ${value.file_name}`
      );
      return;
    }

    for (const value of receivedHashes) {
      if (
        validatedHashes.find((clientValue) =>
          this.validateFile(value, clientValue)
        ) ||
        this.allowedPacks.find((clientValue) =>
          this.validateFile(value, clientValue)
        )
      ) {
        continue;
      }
      console.log(
        `Unauthorized file on client: ${client.loginSessionId} - ${value.file_name}: ${value.crc32_hash}`
      );
      server.kickPlayerWithReason(
        client,
        `Failed asset integrity check - Unauthorized file: ${value.file_name}`
      );
      return;
    }

    console.log(`${client.loginSessionId} passed asset integrity check.`);
    server.sendConsoleText(client, "[SERVER] Passed asset integrity check");
    clearTimeout(client.kickTimer);
    delete client.kickTimer;
  }
}
