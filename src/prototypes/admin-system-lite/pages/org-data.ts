/**
 * 组织架构共享数据（用户管理的组织树使用）
 */

export type OrgType = 'group' | 'region' | 'factory' | 'department' | 'subDepartment';

export type OrgNode = {
    id: string;
    name: string;
    type: OrgType;
    code: string;
    children?: OrgNode[];
    active: boolean;
    fullName?: string;
    tenant?: string;
    parentId?: string;
    remark?: string;
    productionLines?: string[];
};

export const baseOrgData: OrgNode[] = [
    {
        id: '1',
        name: '苏州中材建设有限公司',
        type: 'group',
        code: 'SZCC',
        active: true,
        children: [
            {
                id: '2',
                name: '伊拉克区域公司',
                type: 'region',
                code: 'SZCC-IQ',
                active: true,
                children: [
                    {
                        id: '3',
                        name: 'DCC水泥厂',
                        type: 'factory',
                        code: 'SZCC-IQ-DCC',
                        active: true,
                        children: [
                            {
                                id: '5',
                                name: '烧成车间',
                                type: 'department',
                                code: 'SZCC-IQ-DCC-W01',
                                active: true,
                                children: [
                                    { id: '6', name: '窑系统一班', type: 'subDepartment', code: 'SZCC-IQ-DCC-W01-T01', active: true },
                                    { id: '7', name: '窑系统二班', type: 'subDepartment', code: 'SZCC-IQ-DCC-W01-T02', active: true },
                                    { id: '8', name: '窑系统三班', type: 'subDepartment', code: 'SZCC-IQ-DCC-W01-T03', active: true },
                                ],
                            },
                            {
                                id: '9',
                                name: '制成车间',
                                type: 'department',
                                code: 'SZCC-IQ-DCC-W02',
                                active: true,
                                children: [
                                    { id: '10', name: '磨机一班', type: 'subDepartment', code: 'SZCC-IQ-DCC-W02-T01', active: true },
                                    { id: '11', name: '磨机二班', type: 'subDepartment', code: 'SZCC-IQ-DCC-W02-T02', active: true },
                                ],
                            },
                            { id: '12', name: '中控室', type: 'department', code: 'SZCC-IQ-DCC-W03', active: true },
                        ],
                    },
                    {
                        id: '4',
                        name: '石灰石矿山',
                        type: 'factory',
                        code: 'SZCC-IQ-DCC-M01',
                        active: true,
                    },
                    {
                        id: '13',
                        name: 'Duhok粉磨站',
                        type: 'factory',
                        code: 'SZCC-IQ-DHK',
                        active: true,
                    },
                ],
            },
        ],
    },
];
