// 模擬輕量化、已高度壓縮的避難所資料結構
// 未來我們會寫爬蟲/腳本，把內政部數萬筆資料轉成這種格式存入 App 中

export type Shelter = {
  id: string;
  name: string;
  address: string;
  capacity: number;
};

export type ShelterDatabase = {
  [city: string]: {
    [district: string]: Shelter[];
  };
};

export const mockShelterData: ShelterDatabase = {
  "台北市": {
    "信義區": [
      { id: "tpe-xy-001", name: "信義國小地下室", address: "台北市信義區松仁路100號", capacity: 850 },
      { id: "tpe-xy-002", name: "某某社區大樓防空避難室", address: "台北市信義區信義路五段150巷2號", capacity: 320 },
      { id: "tpe-xy-003", name: "信義運動中心地下停車場", address: "台北市信義區松勤街100號", capacity: 1200 },
    ],
    "大安區": [
      { id: "tpe-da-001", name: "大安森林公園地下停車場", address: "台北市大安區建國南路二段2號", capacity: 4500 },
      { id: "tpe-da-002", name: "建安國小地下室", address: "台北市大安區大安路二段99號", capacity: 600 },
    ]
  },
  "新竹縣": {
    "竹北市": [
      { id: "hsz-zb-001", name: "竹北國民運動中心地下室", address: "新竹縣竹北市莊敬南路18號", capacity: 1500 },
      { id: "hsz-zb-002", name: "十興國小防空避難室", address: "新竹縣竹北市莊敬北路66號", capacity: 800 },
      { id: "hsz-zb-003", name: "某大型商場地下停車場", address: "新竹縣竹北市光明六路東一段265號", capacity: 3000 },
    ],
    "竹東鎮": [
      { id: "hsz-zd-001", name: "竹東鎮公所地下室", address: "新竹縣竹東鎮東林路89號", capacity: 400 },
    ]
  }
};
