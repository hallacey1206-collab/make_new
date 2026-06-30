/**
 * 组织架构共享数据，供组织架构管理和产线配置共用
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
                        productionLines: ['line1', 'line2'],
                        children: [
                            {
                                id: '4',
                                name: '石灰石矿山',
                                type: 'factory',
                                code: 'SZCC-IQ-DCC-M01',
                                active: true,
                            },
                            {
                                id: '5',
                                name: '烧成车间',
                                type: 'department',
                                code: 'SZCC-IQ-DCC-W01',
                                active: true,
                                productionLines: ['line1_burn', 'line2_burn'],
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
                        id: '13',
                        name: 'Duhok粉磨站',
                        type: 'factory',
                        code: 'SZCC-IQ-DHK',
                        active: true,
                        productionLines: ['line3'],
                    },
                ],
            },
        ],
    },
];

/**
 * 将 OrgNode[] 转换为 antd TreeSelect 所需的 treeData 格式。
 * 仅 department 和 subDepartment 层级可选中。
 */
export function orgToTreeSelectData(nodes: OrgNode[]): any[] {
    return nodes.map((node) => {
        const selectable = node.type === 'department' || node.type === 'subDepartment';
        return {
            title: node.name,
            value: node.id,
            disabled: !selectable,
            children: node.children ? orgToTreeSelectData(node.children) : undefined,
        };
    });
}

/* ===== 产线树数据（产线 → 工段），供组织架构和产线配置共用 ===== */
export const productionLineTreeData = [
    {
        title: '一线',
        value: 'line1',
        key: 'line1',
        children: [
            { title: '一线 / 生料工段', value: 'line1_raw', key: 'line1_raw' },
            { title: '一线 / 烧成工段', value: 'line1_burn', key: 'line1_burn' },
            { title: '一线 / 制成工段', value: 'line1_finish', key: 'line1_finish' },
        ],
    },
    {
        title: '二线',
        value: 'line2',
        key: 'line2',
        children: [
            { title: '二线 / 生料工段', value: 'line2_raw', key: 'line2_raw' },
            { title: '二线 / 烧成工段', value: 'line2_burn', key: 'line2_burn' },
            { title: '二线 / 制成工段', value: 'line2_finish', key: 'line2_finish' },
        ],
    },
    {
        title: '三线',
        value: 'line3',
        key: 'line3',
        children: [
            { title: '三线 / 生料工段', value: 'line3_raw', key: 'line3_raw' },
            { title: '三线 / 烧成工段', value: 'line3_burn', key: 'line3_burn' },
            { title: '三线 / 制成工段', value: 'line3_finish', key: 'line3_finish' },
        ],
    },
    {
        title: '水泥粉磨线',
        value: 'line_grind',
        key: 'line_grind',
        children: [
            { title: '水泥粉磨线 / 制成工段', value: 'line_grind_finish', key: 'line_grind_finish' },
        ],
    },
    {
        title: '石灰石破碎线',
        value: 'line_crush',
        key: 'line_crush',
        children: [
            { title: '石灰石破碎线 / 原料工段', value: 'line_crush_raw', key: 'line_crush_raw' },
        ],
    },
];

/** 根据产线叶子节点的 value 查找其全路径名称，如 "line1_burn" → "一线 / 烧成工段" */
export function findProductionLinePath(value: string, nodes: any[] = productionLineTreeData): string | null {
    for (const n of nodes) {
        if (n.value === value) return n.title;
        if (n.children) {
            const found = findProductionLinePath(value, n.children);
            if (found) return found;
        }
    }
    return null;
}

/** 对于部门节点，返回其自身 productionLines 与所有子级 subDepartment 的 productionLines 的并集 */
export function resolveDepartmentProductionLines(node: OrgNode): string[] {
    const set = new Set<string>((node.productionLines || []).map(String));
    if (node.children) {
        node.children.forEach((child) => {
            if (child.type === 'subDepartment') {
                (child.productionLines || []).forEach((l) => set.add(String(l)));
            }
        });
    }
    return Array.from(set);
}

/** 根据 id 查找组织节点全路径名称 */
export function findOrgPathById(nodes: OrgNode[], id: string, parents: string[] = []): string | null {
    for (const node of nodes) {
        const path = [...parents, node.name];
        if (node.id === id) return path.join(' / ');
        if (node.children) {
            const found = findOrgPathById(node.children, id, path);
            if (found) return found;
        }
    }
    return null;
}
