// ============ 智能监控原型 - 共享数据 ============

// 算法类别选项
export const algorithmCategories = [
    '目标检测类',
    '目标跟踪类',
    '图像分类',
    '图像分割',
    '文字识别',
    '数字运算',
];

// 算法模型表格数据
export interface AlgorithmModel {
    key: string;
    index: number;
    code: string;
    name: string;
    enName: string;
    category: string;
    tag: string;
    updateTime: string;
    version: number;
}

export const initialModels: AlgorithmModel[] = [
    { key: '1', index: 1, code: 'aaa', name: '滚轮脱落', enName: 'missing wheel', category: '目标检测类', tag: 'wheel', updateTime: '2025-03-25 20:48:55', version: 15 },
    { key: '2', index: 2, code: 'bbb', name: '未穿工作服', enName: 'Not wearing work clothes', category: '目标跟踪类', tag: 'NRVWU', updateTime: '2025-03-25 20:45:47', version: 8 },
    { key: '3', index: 3, code: 'ccc', name: '未戴安全帽', enName: 'Not wearing a safety helmet', category: '图像分类', tag: 'Helmet', updateTime: '2024-12-06 10:40:56', version: 5 },
    { key: '4', index: 4, code: 'ddd', name: '皮带跑偏', enName: 'Belt deviation', category: '图像分割', tag: 'deviation', updateTime: '2024-12-06 09:15:02', version: 25 },
    { key: '5', index: 5, code: 'eee', name: '皮带撕裂', enName: 'Belt tearing', category: '文字识别', tag: 'tearing', updateTime: '2024-10-31 09:24:09', version: 10 },
    { key: '6', index: 6, code: 'fff', name: '堵料', enName: 'Material blockage', category: '数字运算', tag: 'blockage', updateTime: '2024-10-31 08:39:32', version: 5 },
    { key: '7', index: 7, code: 'ggg', name: '漏料', enName: 'Material leakage', category: '目标检测类', tag: 'leakage', updateTime: '2024-10-31 08:33:36', version: 8 },
    { key: '8', index: 8, code: 'hhh', name: '电子围栏', enName: 'Electronic fence', category: '目标跟踪类', tag: 'fence', updateTime: '2024-10-25 12:32:38', version: 5 },
    { key: '9', index: 9, code: 'iii', name: '夜间盗窃', enName: 'Night theft', category: '图像分类', tag: 'Ntheft', updateTime: '2024-10-25 09:40:00', version: 10 },
    { key: '10', index: 10, code: 'jjj', name: '离岗', enName: 'Leaving the post', category: '图像分割', tag: 'Leaving', updateTime: '2024-10-11 16:43:26', version: 15 },
    { key: '11', index: 11, code: 'kkk', name: '火灾识别', enName: 'Fire detection', category: '目标检测类', tag: 'fire', updateTime: '2024-09-28 14:02:11', version: 3 },
];

// ============ 10-2 算法配置数据 ============

// 节点树数据
export interface TreeNode {
    key: string;
    title: string;
    mac?: string;
    type: 'group' | 'device';
    children?: TreeNode[];
}

export const nodeTreeData: TreeNode[] = [
    {
        key: '1',
        title: '一级1',
        type: 'group',
        children: [
            {
                key: '1-1',
                title: '二级1',
                type: 'group',
                children: [
                    { key: '1-1-1', title: '盒子1', mac: 'bc:fc:e7:16:f3:05', type: 'device' },
                    { key: '1-1-2', title: '盒子2', mac: '48:b0:2d:f9:0f:36', type: 'device' },
                ],
            },
            { key: '1-2', title: '二级2', type: 'group' },
        ],
    },
    { key: '2', title: '一级2', type: 'group' },
];

// 节点信息数据
export interface NodeInfo {
    nodeType: string;
    parentNode: string;
    nodeCode: string;
    nodeName: string;
}

export const nodeInfoMap: Record<string, NodeInfo> = {
    '1': { nodeType: '分组', parentNode: '1线烧成', nodeCode: 'A0001', nodeName: '斜拉链头轮' },
};

// 模型管理 - 部署状态
export type DeployStatus = '未部署' | '部署失败' | '部署成功' | '部署中';

// 模型管理表格数据
export interface DeployModel {
    key: string;
    index: number;
    code: string;
    name: string;
    category: string;
    currentVersion: number;
    latestVersion: number;
    status: DeployStatus;
}

export const initialDeployModels: DeployModel[] = [
    { key: '1', index: 1, code: 'person', name: '行人检测', category: '目标检测类', currentVersion: 2, latestVersion: 4, status: '未部署' },
    { key: '2', index: 2, code: 'chel', name: '车辆违停', category: '目标检测类', currentVersion: 3, latestVersion: 3, status: '部署失败' },
    { key: '3', index: 3, code: 'gongzuofu', name: '工作服模型', category: '目标检测类', currentVersion: 11, latestVersion: 11, status: '部署成功' },
    { key: '4', index: 4, code: 'che2', name: '车辆超速', category: '目标检测类', currentVersion: 1, latestVersion: 2, status: '部署中' },
    { key: '5', index: 5, code: 'fire0', name: '烟火', category: '目标检测类', currentVersion: 1, latestVersion: 3, status: '部署中' },
    { key: '6', index: 6, code: 'shuaidao', name: '行人摔倒', category: '目标检测类', currentVersion: 1, latestVersion: 2, status: '部署中' },
    { key: '7', index: 7, code: 'smoke', name: '烟雾正式', category: '目标检测类', currentVersion: 1, latestVersion: 1, status: '部署中' },
    { key: '8', index: 8, code: 'xinmaol', name: '新脱帽', category: '目标检测类', currentVersion: 10, latestVersion: 10, status: '未部署' },
    { key: '9', index: 9, code: 'anquandai', name: '安全带模型', category: '目标检测类', currentVersion: 4, latestVersion: 5, status: '部署失败' },
    { key: '10', index: 10, code: 'che2', name: '车辆超速', category: '目标检测类', currentVersion: 1, latestVersion: 1, status: '部署成功' },
];

// 算法任务 - 任务状态
export type TaskStatus = '执行中' | '已停止' | '连接中';

// 算法任务表格数据
export interface AlgorithmTask {
    key: string;
    index: number;
    code: string;
    name: string;
    videoSource: string;
    modelName: string;
    currentVersion: number;
    status: TaskStatus;
}

export const initialTasks: AlgorithmTask[] = [
    { key: '1', index: 1, code: 'person', name: '摄像头1_行人检测', videoSource: '摄像头1', modelName: '行人检测', currentVersion: 2, status: '执行中' },
    { key: '2', index: 2, code: 'chel', name: '摄像头2_车辆违停', videoSource: '摄像头2', modelName: '车辆违停', currentVersion: 3, status: '已停止' },
    { key: '3', index: 3, code: 'gongzuofu', name: '摄像头3_工作服模型', videoSource: '摄像头3', modelName: '工作服模型', currentVersion: 11, status: '连接中' },
    { key: '4', index: 4, code: 'che2', name: '摄像头4_车辆超速', videoSource: '摄像头4', modelName: '车辆超速', currentVersion: 1, status: '执行中' },
    { key: '5', index: 5, code: 'fire0', name: '摄像头5_烟火', videoSource: '摄像头5', modelName: '烟火', currentVersion: 1, status: '已停止' },
    { key: '6', index: 6, code: 'shuaidao', name: '摄像头6_行人摔倒', videoSource: '摄像头6', modelName: '行人摔倒', currentVersion: 1, status: '连接中' },
    { key: '7', index: 7, code: 'smoke', name: '摄像头7_烟雾正式', videoSource: '摄像头7', modelName: '烟雾正式', currentVersion: 1, status: '执行中' },
    { key: '8', index: 8, code: 'xinmaol', name: '摄像头8_新脱帽', videoSource: '摄像头8', modelName: '新脱帽', currentVersion: 10, status: '已停止' },
    { key: '9', index: 9, code: 'anquandai', name: '摄像头9_安全带模型', videoSource: '摄像头9', modelName: '安全带模型', currentVersion: 4, status: '连接中' },
    { key: '10', index: 10, code: 'che2', name: '摄像头10_车辆超速', videoSource: '摄像头10', modelName: '车辆超速', currentVersion: 1, status: '连接中' },
];