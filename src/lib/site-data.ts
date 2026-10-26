export type SiteId = "chongming" | "hainan";

export type Site = {
    id: SiteId;
    name: string;
    shortName: string;
    type: string;
    // status: string;
    href: string;
    entryHref?: string;
    coordinates: [number, number];
};

export type PondStatus = "normal" | "feeding" | "warning" | "disabled" | "calibrating";

export type Pond = {
    id: string;
    name: string;
    status: PondStatus;
    temperature: number;
    dissolvedOxygen: number;
    ph: number;
    videoUrl1: string;
    videoUrl2: string;
    videoUrl3: string;
};

export const sites: Record<SiteId, Site> = {
    chongming: {
        id: "chongming",
        name: "崇明基地",
        shortName: "崇明",
        type: "户外池塘养殖",
        // status: "摄像头待接入",
        href: "/sites/chongming",
        coordinates: [121.55, 31.62]
    },
    hainan: {
        id: "hainan",
        name: "文昌冯家湾高层立体智能化养殖",
        shortName: "海南文昌",
        type: "循环水工厂化养殖",
        // status: "摄像头待接入",
        href: "/sites/hainan",
        entryHref: "/sites/hainan/entry",
        coordinates: [110.35, 19.2]
    }
};

export const modulePlaceholders = ["水质浮标", "循环水系统", "鱼病识别", "增氧机控制"];

// Demo-only pond data. Replace the media URL and readings when site material becomes available.
export const demoPonds: Pond[] = [
    {
        id: "01",
        name: "01 号池",
        status: "normal",
        temperature: 27.6,
        dissolvedOxygen: 6.8,
        ph: 7.4,
        videoUrl1: "https://www.imlast.top/iaqua/cam1_30s.mp4",
        videoUrl2: "https://www.imlast.top/iaqua/cam2_30s.mp4",
        videoUrl3: "https://www.imlast.top/iaqua/cam3_30s.mp4"
    },
    {
        id: "02",
        name: "02 号池",
        status: "feeding",
        temperature: 27.2,
        dissolvedOxygen: 6.5,
        ph: 7.3,
        videoUrl1: "https://www.imlast.top/iaqua/cam1_30s.mp4",
        videoUrl2: "https://www.imlast.top/iaqua/cam2_30s.mp4",
        videoUrl3: "https://www.imlast.top/iaqua/cam3_30s.mp4"
    },
    {
        id: "03",
        name: "03 号池",
        status: "warning",
        temperature: 28.1,
        dissolvedOxygen: 5.2,
        ph: 7.6,
        videoUrl1: "https://www.imlast.top/iaqua/cam1_30s.mp4",
        videoUrl2: "https://www.imlast.top/iaqua/cam2_30s.mp4",
        videoUrl3: "https://www.imlast.top/iaqua/cam3_30s.mp4"
    },
    {
        id: "04",
        name: "04 号池",
        status: "normal",
        temperature: 27.4,
        dissolvedOxygen: 6.9,
        ph: 7.4,
        videoUrl1: "https://www.imlast.top/iaqua/cam1_30s.mp4",
        videoUrl2: "https://www.imlast.top/iaqua/cam2_30s.mp4",
        videoUrl3: "https://www.imlast.top/iaqua/cam3_30s.mp4"
    },
    {
        id: "05",
        name: "05 号池",
        status: "disabled",
        temperature: 26.8,
        dissolvedOxygen: 6.1,
        ph: 7.2,
        videoUrl1: "https://www.imlast.top/iaqua/cam1_30s.mp4",
        videoUrl2: "https://www.imlast.top/iaqua/cam2_30s.mp4",
        videoUrl3: "https://www.imlast.top/iaqua/cam3_30s.mp4"
    },
    {
        id: "06",
        name: "06 号池",
        status: "normal",
        temperature: 27.8,
        dissolvedOxygen: 7.1,
        ph: 7.5,
        videoUrl1: "https://www.imlast.top/iaqua/cam1_30s.mp4",
        videoUrl2: "https://www.imlast.top/iaqua/cam2_30s.mp4",
        videoUrl3: "https://www.imlast.top/iaqua/cam3_30s.mp4"
    },
    {
        id: "07",
        name: "07 号池",
        status: "calibrating",
        temperature: 27.1,
        dissolvedOxygen: 6.6,
        ph: 7.3,
        videoUrl1: "https://www.imlast.top/iaqua/cam1_30s.mp4",
        videoUrl2: "https://www.imlast.top/iaqua/cam2_30s.mp4",
        videoUrl3: "https://www.imlast.top/iaqua/cam3_30s.mp4"
    },
    {
        id: "08",
        name: "08 号池",
        status: "normal",
        temperature: 27.5,
        dissolvedOxygen: 6.7,
        ph: 7.4,
        videoUrl1: "https://www.imlast.top/iaqua/cam1_30s.mp4",
        videoUrl2: "https://www.imlast.top/iaqua/cam2_30s.mp4",
        videoUrl3: "https://www.imlast.top/iaqua/cam3_30s.mp4"
    }
];
