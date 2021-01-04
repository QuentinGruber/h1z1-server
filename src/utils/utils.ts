import _ from "lodash";


export const Int64String = function (value: number) {
  return "0x" + ("0000000000000000" + value.toString(16)).substr(-16);
}

export const generateGuid = function (guidList: Array<string> = []) {
  let guid: string;
  do {
  guid = "0x";
  for (var i: any = 0; i < 16; i++) {
    guid += (Math.floor(Math.random() * 16).toString(16) as string);
  }
  }
  while (!_.indexOf(guidList, guid))
  return guid
};