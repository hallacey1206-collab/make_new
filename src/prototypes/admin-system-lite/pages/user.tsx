import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import {
    Plus,
    Trash2,
    Phone,
    Mail,
    KeyRound,
    UserCog,
    Briefcase,
    Lock,
    LockOpen,
} from 'lucide-react';
import {
    Table,
    Button,
    Input,
    Select,
    TreeSelect,
    Modal,
    Form,
    Tree,
    Pagination,
    Tag,
    Space,
    Row,
    Col,
    DatePicker,
    message,
    Avatar,
    Drawer,
    Upload,
    Checkbox,
} from 'antd';
import { baseOrgData } from './org-data';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';

 type PartTimeItem = {
    position: string;
    org: string;
};

 type UserResponsibility = {
    processes?: string[];
    equipment?: string[];
    maintenance?: string[];
};

 type UserItem = {
    id: string;
    name: string;
    employeeNo: string;
    phone: string;
    email: string;
    entryDate: string;
    birthday?: string;
    status: 'active' | 'leave' | 'frozen';
    userType: 'internal' | 'contractor' | 'temp';
    enabled?: boolean;
    mainPosition: string;
    mainOrg: string;
    partTimePositions: string[];
    partTimeItems?: PartTimeItem[];
    roles: string[];
    accountExpiry?: string;
    loginRestrict?: string;
    gender?: 'male' | 'female';
    idCard?: string;
    avatar?: string;
    gestureUnlock?: string;
    passwordUnlock?: string;
    positions?: string[];
    responsibility?: UserResponsibility;
};

 const initialUsers: UserItem[] = [
    {
        id: 'u1',
        name: '王志强',
        employeeNo: 'SZCC-2018-0042',
        phone: '+964-750-234-5678',
        email: 'wang.zhiqiang@szcc.com',
        entryDate: '2018-05-12',
        status: 'active',
        userType: 'internal',
        mainPosition: 'DCC水泥厂厂长',
        mainOrg: 'DCC水泥厂',
        partTimePositions: [],
        roles: ['工厂管理员', '生产审批'],
    },
    {
        id: 'u2',
        name: '孙立军',
        employeeNo: 'SZCC-2019-0087',
        phone: '+964-750-345-6789',
        email: 'sun.lijun@szcc.com',
        entryDate: '2019-03-20',
        status: 'active',
        userType: 'internal',
        mainPosition: '烧成班长',
        mainOrg: '烧成车间',
        partTimePositions: ['窑系统应急负责人'],
        roles: ['车间安全员'],
    },
    {
        id: 'u3',
        name: '周海涛',
        employeeNo: 'SZCC-2020-0156',
        phone: '+964-750-456-7890',
        email: 'zhou.haitao@szcc.com',
        entryDate: '2020-07-08',
        status: 'active',
        userType: 'internal',
        mainPosition: '窑系统一班班长',
        mainOrg: '烧成车间',
        partTimePositions: [],
        roles: ['窑系统监控'],
    },
    {
        id: 'u4',
        name: '陈铁军',
        employeeNo: 'SZCC-2019-0091',
        phone: '+964-750-567-8901',
        email: 'chen.tiejun@szcc.com',
        entryDate: '2019-04-15',
        status: 'active',
        userType: 'internal',
        mainPosition: '制成车间主任',
        mainOrg: '制成车间',
        partTimePositions: [],
        roles: ['生产报表审核', '车间安全管理'],
    },
    {
        id: 'u5',
        name: 'Ali Hassan',
        employeeNo: 'SZCC-EXT-2022-003',
        phone: '+964-750-678-9012',
        email: 'ali.hassan@contractor.iq',
        entryDate: '2022-01-10',
        status: 'active',
        userType: 'contractor',
        mainPosition: '外部运输协调员',
        mainOrg: 'DCC水泥厂',
        partTimePositions: [],
        roles: ['运输调度查看'],
        accountExpiry: '2025-12-31',
        loginRestrict: '仅厂区内网',
    },
    {
        id: 'u6',
        name: '赵大勇',
        employeeNo: 'SZCC-2018-0055',
        phone: '+964-750-789-0123',
        email: 'zhao.dayong@szcc.com',
        entryDate: '2018-06-01',
        status: 'leave',
        userType: 'internal',
        mainPosition: '矿山负责人',
        mainOrg: '石灰石矿山',
        partTimePositions: [],
        roles: ['矿山管理'],
    },
    {
        id: 'u7',
        name: '李明远',
        employeeNo: 'SZCC-2017-0012',
        phone: '+964-750-123-4567',
        email: 'li.mingyuan@szcc.com',
        entryDate: '2017-09-01',
        status: 'active',
        userType: 'internal',
        mainPosition: '伊拉克区域总经理',
        mainOrg: '伊拉克区域公司',
        partTimePositions: [],
        roles: ['区域管理员', '集团报表'],
    },
];

 const roleOptions = [
    '工厂管理员',
    '生产审批',
    '车间安全员',
    '窑系统监控',
    '生产报表审核',
    '车间安全管理',
    '运输调度查看',
    '矿山管理',
    '区域管理员',
    '集团报表',
    '中控数据录入',
    '设备检修审批',
    '磨机监控',
    '销售合同审批',
    '客户管理',
    '化验单审核',
    '配方管理',
    '采购审批',
    '财务审核',
];

 const positionOptions = [
    'DCC水泥厂厂长',
    '烧成班长',
    '窑系统一班班长',
    '制成车间主任',
    '外部运输协调员',
    '矿山负责人',
    '伊拉克区域总经理',
    '窑操作员',
    '磨机操作员',
    '制成班长',
    '中控室操作员',
];

 const positionToRoles: Record<string, string[]> = {
    'DCC水泥厂厂长': ['工厂管理员', '生产审批'],
    '烧成班长': ['车间安全员'],
    '窑系统一班班长': ['窑系统监控'],
    '制成车间主任': ['生产报表审核', '车间安全管理'],
    '外部运输协调员': ['运输调度查看'],
    '矿山负责人': ['矿山管理'],
    '伊拉克区域总经理': ['区域管理员', '集团报表'],
    '窑操作员': ['中控数据录入'],
    '磨机操作员': ['磨机监控'],
    '制成班长': ['生产报表审核'],
    '中控室操作员': ['中控数据录入'],
};

 const orgTreeData: DataNode[] = [
    {
        key: '1',
        title: '苏州中材建设有限公司',
        children: [
            {
                key: '2',
                title: '伊拉克区域公司',
                children: [
                    {
                        key: '3',
                        title: 'DCC水泥厂',
                        children: [
                            { key: '4', title: '石灰石矿山' },
                            {
                                key: '5',
                                title: '烧成车间',
                                children: [
                                    { key: '6', title: '窑系统一班' },
                                    { key: '7', title: '窑系统二班' },
                                    { key: '8', title: '窑系统三班' },
                                ],
                            },
                            {
                                key: '9',
                                title: '制成车间',
                                children: [
                                    { key: '10', title: '磨机一班' },
                                    { key: '11', title: '磨机二班' },
                                ],
                            },
                            { key: '12', title: '中控室' },
                        ],
                    },
                    { key: '13', title: 'Duhok粉磨站' },
                ],
            },
        ],
    },
];

 const userTypeLabel: Record<string, string> = { internal: '内部员工', contractor: '外部承包商', temp: '临时人员' };
 const statusMeta: Record<string, { label: string; color: string }> = {
    active: { label: '在职', color: 'success' },
    leave: { label: '离职', color: 'error' },
    frozen: { label: '冻结', color: 'warning' },
};

const orgNameMap: Record<string, string> = {};
function buildOrgNameMap(nodes: DataNode[]) {
    for (const n of nodes) {
        orgNameMap[String(n.key)] = String(n.title);
        if (n.children) buildOrgNameMap(n.children);
    }
}
buildOrgNameMap(orgTreeData);

/** 将组织架构数据转为 TreeSelect 可用的 treeData，所有层级均可选，value 为组织名称 */
function toOrgTreeSelectData(nodes: typeof baseOrgData): any[] {
    return nodes.map((node) => ({
        title: node.name,
        value: node.name,
        children: node.children ? toOrgTreeSelectData(node.children) : undefined,
    }));
}
const orgTreeSelectData = toOrgTreeSelectData(baseOrgData);

/** 根据组织名称查找其从根节点开始的完整路径 */
function findOrgPathByName(nodes: typeof baseOrgData, name: string, parents: string[] = []): string | null {
    for (const node of nodes) {
        const path = [...parents, node.name];
        if (node.name === name) return path.join(' / ');
        if (node.children) {
            const found = findOrgPathByName(node.children, name, path);
            if (found) return found;
        }
    }
    return null;
}

/** 管理设备树：按【工序 → 设备 → 子设备】三级层级组织；设备与子设备以【设备编码】设备名称格式展示 */
const equipmentTreeData: any[] = [
    {
        title: '一线原料',
        key: 'proc-raw1',
        value: '一线原料',
        children: [
            {
                title: '【SB-101】重型板喂机',
                key: 'dev-101',
                value: '【SB-101】重型板喂机',
                children: [
                    { title: '【SB-101-01】链板组件', key: 'sub-1011', value: '【SB-101-01】链板组件' },
                    { title: '【SB-101-02】减速电机', key: 'sub-1012', value: '【SB-101-02】减速电机' },
                ],
            },
            {
                title: '【SB-102】锤式破碎机本体',
                key: 'dev-102',
                value: '【SB-102】锤式破碎机本体',
                children: [
                    { title: '【SB-102-01】转子总成', key: 'sub-1021', value: '【SB-102-01】转子总成' },
                    { title: '【SB-102-02】筛板', key: 'sub-1022', value: '【SB-102-02】筛板' },
                ],
            },
        ],
    },
    {
        title: '一线烧成',
        key: 'proc-burn1',
        value: '一线烧成',
        children: [
            {
                title: '【SB-201】低压电动机',
                key: 'dev-201',
                value: '【SB-201】低压电动机',
                children: [
                    { title: '【SB-201-01】定子绕组', key: 'sub-2011', value: '【SB-201-01】定子绕组' },
                    { title: '【SB-201-02】转子', key: 'sub-2012', value: '【SB-201-02】转子' },
                ],
            },
            {
                title: '【SB-202】高压电动机',
                key: 'dev-202',
                value: '【SB-202】高压电动机',
                children: [
                    { title: '【SB-202-01】轴承', key: 'sub-2021', value: '【SB-202-01】轴承' },
                    { title: '【SB-202-02】冷却器', key: 'sub-2022', value: '【SB-202-02】冷却器' },
                ],
            },
            {
                title: '【SB-203】液压站',
                key: 'dev-203',
                value: '【SB-203】液压站',
                children: [
                    { title: '【SB-203-01】液压油泵', key: 'sub-2031', value: '【SB-203-01】液压油泵' },
                    { title: '【SB-203-02】油箱', key: 'sub-2032', value: '【SB-203-02】油箱' },
                ],
            },
        ],
    },
    {
        title: '一线制成',
        key: 'proc-make1',
        value: '一线制成',
        children: [
            {
                title: '【SB-301】减速机',
                key: 'dev-301',
                value: '【SB-301】减速机',
                children: [
                    { title: '【SB-301-01】齿轮箱', key: 'sub-3011', value: '【SB-301-01】齿轮箱' },
                    { title: '【SB-301-02】联轴器', key: 'sub-3012', value: '【SB-301-02】联轴器' },
                ],
            },
            {
                title: '【SB-302】输送带',
                key: 'dev-302',
                value: '【SB-302】输送带',
                children: [
                    { title: '【SB-302-01】胶带', key: 'sub-3021', value: '【SB-302-01】胶带' },
                    { title: '【SB-302-02】传动滚筒', key: 'sub-3022', value: '【SB-302-02】传动滚筒' },
                ],
            },
            {
                title: '【SB-303】低压电气柜',
                key: 'dev-303',
                value: '【SB-303】低压电气柜',
                children: [
                    { title: '【SB-303-01】断路器', key: 'sub-3031', value: '【SB-303-01】断路器' },
                    { title: '【SB-303-02】接触器', key: 'sub-3032', value: '【SB-303-02】接触器' },
                ],
            },
        ],
    },
    {
        title: '二线原料',
        key: 'proc-raw2',
        value: '二线原料',
        children: [
            {
                title: '【SB-111】重型板喂机',
                key: 'dev-111',
                value: '【SB-111】重型板喂机',
                children: [
                    { title: '【SB-111-01】链板组件', key: 'sub-1111', value: '【SB-111-01】链板组件' },
                    { title: '【SB-111-02】减速电机', key: 'sub-1112', value: '【SB-111-02】减速电机' },
                ],
            },
        ],
    },
    {
        title: '二线烧成',
        key: 'proc-burn2',
        value: '二线烧成',
        children: [
            {
                title: '【SB-211】低压电动机',
                key: 'dev-211',
                value: '【SB-211】低压电动机',
                children: [
                    { title: '【SB-211-01】定子绕组', key: 'sub-2111', value: '【SB-211-01】定子绕组' },
                    { title: '【SB-211-02】转子', key: 'sub-2112', value: '【SB-211-02】转子' },
                ],
            },
            {
                title: '【SB-212】高压电动机',
                key: 'dev-212',
                value: '【SB-212】高压电动机',
                children: [
                    { title: '【SB-212-01】轴承', key: 'sub-2121', value: '【SB-212-01】轴承' },
                    { title: '【SB-212-02】冷却器', key: 'sub-2122', value: '【SB-212-02】冷却器' },
                ],
            },
        ],
    },
    {
        title: '二线制成',
        key: 'proc-make2',
        value: '二线制成',
        children: [
            {
                title: '【SB-311】减速机',
                key: 'dev-311',
                value: '【SB-311】减速机',
                children: [
                    { title: '【SB-311-01】齿轮箱', key: 'sub-3111', value: '【SB-311-01】齿轮箱' },
                    { title: '【SB-311-02】联轴器', key: 'sub-3112', value: '【SB-311-02】联轴器' },
                ],
            },
            {
                title: '【SB-312】输送带',
                key: 'dev-312',
                value: '【SB-312】输送带',
                children: [
                    { title: '【SB-312-01】胶带', key: 'sub-3121', value: '【SB-312-01】胶带' },
                    { title: '【SB-312-02】传动滚筒', key: 'sub-3122', value: '【SB-312-02】传动滚筒' },
                ],
            },
        ],
    },
    {
        title: '一线其他',
        key: 'proc-other1',
        value: '一线其他',
        children: [
            {
                title: '【SB-401】液压站',
                key: 'dev-401',
                value: '【SB-401】液压站',
                children: [
                    { title: '【SB-401-01】液压油泵', key: 'sub-4011', value: '【SB-401-01】液压油泵' },
                    { title: '【SB-401-02】油箱', key: 'sub-4012', value: '【SB-401-02】油箱' },
                ],
            },
        ],
    },
    {
        title: '二线其他',
        key: 'proc-other2',
        value: '二线其他',
        children: [
            {
                title: '【SB-411】低压电气柜',
                key: 'dev-411',
                value: '【SB-411】低压电气柜',
                children: [
                    { title: '【SB-411-01】断路器', key: 'sub-4111', value: '【SB-411-01】断路器' },
                    { title: '【SB-411-02】接触器', key: 'sub-4112', value: '【SB-411-02】接触器' },
                ],
            },
        ],
    },
];

 export default function UserPage() {
    const [users, setUsers] = useState<UserItem[]>(initialUsers.map((u) => ({ ...u, enabled: u.enabled ?? true })));
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'leave' | 'frozen'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'internal' | 'contractor' | 'temp'>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [form, setForm] = useState<Partial<UserItem>>({});
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // 角色配置（批量）相关状态
    const [roleConfigOpen, setRoleConfigOpen] = useState(false);
    const [roleConfigValues, setRoleConfigValues] = useState<string[]>([]);

    // 职责配置（侧滑抽屉）相关状态
    const [respOpen, setRespOpen] = useState(false);
    const [respTargetIds, setRespTargetIds] = useState<string[]>([]);
    const [respForm, setRespForm] = useState<UserResponsibility>({ processes: [], equipment: [], maintenance: [] });

    const [treeSelectedId, setTreeSelectedId] = useState<string | null>(null);
    const [treeExpanded, setTreeExpanded] = useState<string[]>(['1', '2', '3']);

    // 交接人相关状态
    const [handoverModalOpen, setHandoverModalOpen] = useState(false);
    const [handoverSelectorOpen, setHandoverSelectorOpen] = useState(false);
    const [handoverSelectedUser, setHandoverSelectedUser] = useState<string | null>(null);
    const [handoverAction, setHandoverAction] = useState<(() => void) | null>(null);
    const [handoverDesc, setHandoverDesc] = useState('');
    const [unfreezeModalOpen, setUnfreezeModalOpen] = useState(false);
    const [unfreezeAction, setUnfreezeAction] = useState<(() => void) | null>(null);
    const [handoverSearch, setHandoverSearch] = useState('');
    const [handoverExpandedKeys, setHandoverExpandedKeys] = useState<string[]>(['1', '2', '3']);

    const treeSelectedName = useMemo(() => {
        if (!treeSelectedId) return null;
        return orgNameMap[treeSelectedId] || null;
    }, [treeSelectedId]);

    // 交接人确认框辅助文案（按操作类型区分）
    const HANDOVER_FREEZE_DESC = '该操作将变更用户状态，其名下的任务、待办事项、消息等可临时委托给指定的交接人，并且相关配置将临时替换为交接人。是否为该用户指定交接人？';
    const HANDOVER_LEAVE_DELETE_DESC = '该操作将变更用户状态，其名下的任务、待办事项、消息等可交接给指定的交接人，并且删除该用户相关配置。是否为该用户指定交接人？';

    /** 对用户进行离职/冻结/删除等操作时，先询问是否指定交接人 */
    const showHandoverConfirm = (actionLabel: string, onConfirm: () => void, desc: string) => {
        setHandoverAction(() => onConfirm);
        setHandoverDesc(desc);
        setHandoverModalOpen(true);
    };

    /** 解冻操作确认框（解冻会取消交接人委托及相关配置） */
    const showUnfreezeConfirm = (onConfirm: () => void) => {
        setUnfreezeAction(() => onConfirm);
        setUnfreezeModalOpen(true);
    };

    const handleHandoverYes = () => {
        setHandoverModalOpen(false);
        setHandoverSelectorOpen(true);
    };

    const handleHandoverNo = () => {
        setHandoverModalOpen(false);
        handoverAction?.();
    };

    const handleHandoverSelectConfirm = () => {
        const target = users.find((u) => u.id === handoverSelectedUser);
        handoverAction?.();
        setHandoverSelectorOpen(false);
        setHandoverSelectedUser(null);
        setHandoverAction(null);
        if (target) {
            message.success(`已将该用户的任务、待办、消息移交至 ${target.name}`);
        }
    };

    const filtered = users.filter((u) => {
        const text = `${u.name}${u.employeeNo}${u.phone}${u.mainPosition}`.toLowerCase();
        const matchSearch = text.includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || u.status === statusFilter;
        const matchType = typeFilter === 'all' || u.userType === typeFilter;
        const matchOrg = !treeSelectedName || u.mainOrg === treeSelectedName || u.mainOrg.includes(treeSelectedName);
        return matchSearch && matchStatus && matchType && matchOrg;
    });

    const total = filtered.length;
    const pagedUsers = filtered.slice((page - 1) * pageSize, page * pageSize);

    const openAdd = () => {
        setModalMode('add');
        setForm({
            status: 'active',
            userType: 'internal',
            enabled: true,
            mainPosition: '',
            mainOrg: '',
            partTimePositions: [],
            positions: [],
            roles: [],
            gender: undefined,
            idCard: '',
            birthday: '',
            avatar: '',
            gestureUnlock: '',
            passwordUnlock: '',
        });
        setModalOpen(true);
    };

    const openEdit = (id: string) => {
        const u = users.find((x) => x.id === id);
        if (!u) return;
        setModalMode('edit');
        setForm({
            ...u,
            positions: Array.from(new Set([u.mainPosition, ...u.partTimePositions])).filter(Boolean),
        });
        setModalOpen(true);
    };

    /** 复制用户：打开新增用户弹窗，并预填充所选用户的信息 */
    const openCopy = (id: string) => {
        const u = users.find((x) => x.id === id);
        if (!u) return;
        setModalMode('add');
        // 去掉 id，保存时会生成新 id
        const { id: _omit, ...rest } = u;
        setForm({
            ...rest,
            positions: Array.from(new Set([u.mainPosition, ...u.partTimePositions])).filter(Boolean),
        });
        setModalOpen(true);
    };

    /** 真正落库用户保存（新增/编辑共用） */
    const applyUserSave = (saveData: UserItem) => {
        if (modalMode === 'add') {
            const newUser: UserItem = { ...saveData, id: `u${Date.now()}` };
            setUsers([...users, newUser]);
            message.success('新增用户成功');
        } else if (form.id) {
            setUsers(users.map((u) => (u.id === form.id ? { ...u, ...saveData } as UserItem : u)));
            message.success('编辑用户成功');
        }
        setModalOpen(false);
    };

    const handleSave = () => {
        // 将「所属岗位」多选映射回主岗 + 兼职岗位
        const positions = (form.positions || []).filter(Boolean);
        const mainPosition = positions[0] || '';
        const partTimePositions = positions.slice(1);
        const saveData = { ...form, mainPosition, partTimePositions } as UserItem;

        // 表单勾选「是否冻结」=是 时，需要交接人确认（新增与编辑一致）
        if (saveData.status === 'frozen' || saveData.status === 'leave') {
            const label = saveData.status === 'frozen' ? '冻结' : '离职';
            const desc = saveData.status === 'frozen' ? HANDOVER_FREEZE_DESC : HANDOVER_LEAVE_DELETE_DESC;
            showHandoverConfirm(label, () => applyUserSave(saveData), desc);
            return;
        }

        applyUserSave(saveData);
    };

    const batchDelete = () => {
        showHandoverConfirm('批量删除', () => {
            setUsers((prev) => prev.filter((u) => !selectedIds.has(u.id)));
            setSelectedIds(new Set());
            message.success('批量删除成功');
        }, HANDOVER_LEAVE_DELETE_DESC);
    };

    /** 批量冻结：将选中的用户状态置为「冻结」 */
    const batchFreeze = () => {
        if (selectedIds.size === 0) return;
        Modal.confirm({
            title: `确定冻结选中的 ${selectedIds.size} 个用户？`,
            content: '冻结后这些用户将无法登录系统。',
            onOk: () => {
                setUsers((prev) =>
                    prev.map((u) => (selectedIds.has(u.id) ? { ...u, status: 'frozen' } : u)),
                );
                message.success(`已冻结 ${selectedIds.size} 个用户`);
                setSelectedIds(new Set());
            },
        });
    };

    /** 批量解冻：将选中的、处于冻结状态的用户恢复为「在职」 */
    const batchUnfreeze = () => {
        if (selectedIds.size === 0) return;
        showUnfreezeConfirm(() => {
            setUsers((prev) =>
                prev.map((u) =>
                    selectedIds.has(u.id) && u.status === 'frozen'
                        ? { ...u, status: 'active' }
                        : u,
                ),
            );
            message.success(`已解冻 ${selectedIds.size} 个用户`);
            setSelectedIds(new Set());
        });
    };

    /** 单行冻结：变更状态前询问是否指定交接人 */
    const freezeUser = (id: string) => {
        const u = users.find((x) => x.id === id);
        if (!u) return;
        showHandoverConfirm('冻结', () => {
            setUsers(users.map((x) => (x.id === id ? { ...x, status: 'frozen' } : x)));
            message.success('已冻结该用户');
        }, HANDOVER_FREEZE_DESC);
    };

    /** 单行解冻：将冻结状态的用户恢复为「在职」 */
    const unfreezeUser = (id: string) => {
        showUnfreezeConfirm(() => {
            setUsers(users.map((x) => (x.id === id && x.status === 'frozen' ? { ...x, status: 'active' } : x)));
            message.success('已解冻该用户');
        });
    };

    const batchResetPassword = () => {
        if (selectedIds.size === 0) return;
        Modal.confirm({
            title: `确定重置选中的 ${selectedIds.size} 个用户密码？`,
            content: '重置后这些用户需使用初始密码重新登录。',
            onOk: () => {
                message.success(`已重置 ${selectedIds.size} 个用户的密码`);
                setSelectedIds(new Set());
            },
        });
    };

    /** 打开角色配置对话框（批量），并清空已选角色 */
    const openRoleConfig = () => {
        setRoleConfigValues([]);
        setRoleConfigOpen(true);
    };

    /** 批量配置角色：将所选用户的角色统一替换为选中的角色集合 */
    const handleRoleConfigConfirm = () => {
        if (selectedIds.size === 0) return;
        setUsers((prev) =>
            prev.map((u) =>
                selectedIds.has(u.id) ? { ...u, roles: [...roleConfigValues] } as UserItem : u,
            ),
        );
        message.success(`已为 ${selectedIds.size} 个用户配置角色`);
        setSelectedIds(new Set());
        setRoleConfigOpen(false);
    };

    /** 打开职责配置侧滑抽屉：单个用户或批量 */
    const openResponsibilityConfig = (ids: string[]) => {
        setRespTargetIds(ids);
        if (ids.length === 1) {
            const u = users.find((x) => x.id === ids[0]);
            setRespForm(u?.responsibility || { processes: [], equipment: [], maintenance: [] });
        } else {
            setRespForm({ processes: [], equipment: [], maintenance: [] });
        }
        setRespOpen(true);
    };

    /** 保存职责配置：将配置写入目标用户 */
    const handleResponsibilitySave = () => {
        setUsers((prev) =>
            prev.map((u) =>
                respTargetIds.includes(u.id) ? { ...u, responsibility: { ...respForm } } as UserItem : u,
            ),
        );
        message.success(`已为 ${respTargetIds.length} 位用户配置职责`);
        setRespOpen(false);
        setSelectedIds(new Set());
    };

    const rowSelection = {
        selectedRowKeys: Array.from(selectedIds),
        onChange: (keys: React.Key[]) => {
            setSelectedIds(new Set(keys as string[]));
        },
    };

    const columns: ColumnsType<UserItem> = [
        {
            title: '用户姓名',
            dataIndex: 'name',
            render: (_, u) => (
                <Space>
                    <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>{u.name[0]}</Avatar>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{u.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: '登录名',
            dataIndex: 'employeeNo',
        },
        {
            title: '所属租户',
            render: () => 'DCC项目部',
        },
        {
            title: '角色',
            dataIndex: 'roles',
            render: (roles: string[]) => (
                <Space size={4} wrap>
                    {roles.map((r) => (
                        <Tag key={r} style={{ fontSize: 11 }}>{r}</Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: '所属部门',
            dataIndex: 'mainOrg',
        },
        {
            title: '状态',
            dataIndex: 'status',
            onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
            onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
            render: (_, u) => (
                <Tag color={statusMeta[u.status].color} style={{ fontSize: 11 }}>
                    {statusMeta[u.status].label}
                </Tag>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 220,
            render: (_, u) => (
                <Space size="small">
                    <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); openEdit(u.id); }}>编辑</Button>
                    <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); openCopy(u.id); }}>复制</Button>
                    {u.status !== 'leave' && (
                        <>
                            {u.status === 'frozen' ? (
                                <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); unfreezeUser(u.id); }}>解冻</Button>
                            ) : (
                                <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); freezeUser(u.id); }}>冻结</Button>
                            )}
                            <Button type="link" size="small" icon={<Briefcase size={12} />} onClick={(e) => { e.stopPropagation(); openResponsibilityConfig([u.id]); }}>职责配置</Button>
                            <Button type="link" size="small" onClick={(e) => {
                                e.stopPropagation();
                                Modal.confirm({
                                    title: '确定重置该用户密码？',
                                    onOk: () => message.success('密码已重置'),
                                });
                            }}>重置密码</Button>
                        </>
                    )}
                    <Button type="link" size="small" danger onClick={(e) => {
                        e.stopPropagation();
                        showHandoverConfirm('删除', () => {
                            setUsers(users.filter((x) => x.id !== u.id));
                            message.success('删除成功');
                        }, HANDOVER_LEAVE_DELETE_DESC);
                    }}>删除</Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div data-annotation-id="user-filter-bar" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Button type="primary" icon={<Plus size={14} />} onClick={openAdd}>新增用户</Button>
                {selectedIds.size > 0 && (
                    <Space>
                        <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>已选 {selectedIds.size} 项</span>
                        <Button size="small" icon={<KeyRound size={12} />} onClick={batchResetPassword}>重置密码</Button>
                        <Button size="small" icon={<UserCog size={12} />} onClick={openRoleConfig}>角色配置</Button>
                        <Button size="small" icon={<Briefcase size={12} />} onClick={() => openResponsibilityConfig(Array.from(selectedIds))}>职责配置</Button>
                        <Button size="small" icon={<Lock size={12} />} onClick={batchFreeze}>冻结</Button>
                        <Button size="small" icon={<LockOpen size={12} />} onClick={batchUnfreeze}>解冻</Button>
                        <Button size="small" danger icon={<Trash2 size={12} />} onClick={batchDelete}>删除</Button>
                    </Space>
                )}
                <div style={{ flex: 1 }} />
                <Select
                    value={statusFilter}
                    style={{ width: 120 }}
                    onChange={(v) => setStatusFilter(v)}
                    options={[
                        { value: 'all', label: '全部状态' },
                        { value: 'active', label: '在职' },
                        { value: 'frozen', label: '冻结' },
                        { value: 'leave', label: '离职' },
                    ]}
                />
                <Input.Search
                    placeholder="搜索用户..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 200 }}
                    allowClear
                />
            </div>

            <div className="admin-split">
                <div className="admin-split-left" style={{ width: 240, minWidth: 240, padding: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, padding: '0 0 8px' }}>组织机构</div>
                    <Tree
                        treeData={orgTreeData}
                        selectedKeys={treeSelectedId ? [treeSelectedId] : []}
                        expandedKeys={treeExpanded}
                        onExpand={(keys) => setTreeExpanded(keys as string[])}
                        onSelect={(keys) => setTreeSelectedId(keys[0] as string || null)}
                    />
                    {treeSelectedId && (
                        <div style={{ padding: '8px 0' }}>
                            <Button size="small" onClick={() => setTreeSelectedId(null)}>清除筛选</Button>
                        </div>
                    )}
                </div>

                <div className="admin-split-right">
                    <div data-annotation-id="user-table" className="admin-card" style={{ padding: 0 }}>
                        <Table
                            rowKey="id"
                            rowSelection={rowSelection}
                            columns={columns}
                            dataSource={pagedUsers}
                            pagination={false}
                        />
                        {filtered.length === 0 && <div className="admin-empty">未找到匹配的用户</div>}
                        {filtered.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 12 }}>
                                <Pagination
                                    current={page}
                                    pageSize={pageSize}
                                    total={total}
                                    onChange={(p, ps) => { setPage(p); setPageSize(ps || 10); }}
                                    showSizeChanger
                                    pageSizeOptions={[10, 20, 50]}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Drawer
                open={modalOpen}
                title={modalMode === 'add' ? '新增用户' : '编辑用户'}
                onClose={() => setModalOpen(false)}
                width={800}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button onClick={() => setModalOpen(false)}>取消</Button>
                        <Button type="primary" onClick={handleSave}>保存</Button>
                    </div>
                }
            >
                <Form layout="vertical" data-annotation-id="user-form-drawer">
                    {/* 基础信息 */}
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'rgba(0,0,0,0.85)' }}>基础信息</div>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="登录账号" required>
                                <Input
                                    showCount
                                    maxLength={20}
                                    value={form.employeeNo || ''}
                                    onChange={(e) => setForm({ ...form, employeeNo: e.target.value })}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="手势解锁">
                                <Input
                                    placeholder="App自动填入"
                                    value={form.gestureUnlock || ''}
                                    onChange={(e) => setForm({ ...form, gestureUnlock: e.target.value })}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="密码解锁">
                                <Input
                                    placeholder="App自动填入"
                                    value={form.passwordUnlock || ''}
                                    onChange={(e) => setForm({ ...form, passwordUnlock: e.target.value })}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="状态" required>
                                <Select
                                    value={form.status}
                                    onChange={(v) => setForm({ ...form, status: v as UserItem['status'] })}
                                    options={[
                                        { value: 'active', label: '在职' },
                                        { value: 'leave', label: '离职' },
                                        { value: 'frozen', label: '冻结' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* 详细信息 */}
                    <div style={{ fontSize: 14, fontWeight: 600, margin: '24px 0 16px', color: 'rgba(0,0,0,0.85)' }}>详细信息</div>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="用户姓名" required>
                                <Input
                                    value={form.name || ''}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="手机号码" required>
                                <Input
                                    showCount
                                    maxLength={20}
                                    value={form.phone || ''}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="email" required>
                                <Input
                                    showCount
                                    maxLength={30}
                                    value={form.email || ''}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="用户性别">
                                <Select
                                    value={form.gender || undefined}
                                    placeholder="请选择性别"
                                    onChange={(v) => setForm({ ...form, gender: v })}
                                    options={[
                                        { value: 'male', label: '男' },
                                        { value: 'female', label: '女' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="身份证号">
                                <Input
                                    value={form.idCard || ''}
                                    onChange={(e) => setForm({ ...form, idCard: e.target.value })}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="用户生日">
                                <DatePicker
                                    style={{ width: '100%' }}
                                    showTime
                                    value={form.birthday ? dayjs(form.birthday) : null}
                                    onChange={(d) => setForm({ ...form, birthday: d ? d.format('YYYY-MM-DD HH:mm:ss') : '' })}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="头像">
                        <Upload
                            listType="picture-card"
                            showUploadList={false}
                            beforeUpload={() => false}
                            onChange={({ file }) => {
                                if (file.originFileObj) {
                                    const reader = new FileReader();
                                    reader.onload = (e) => setForm({ ...form, avatar: e.target?.result as string });
                                    reader.readAsDataURL(file.originFileObj);
                                }
                            }}
                        >
                            {form.avatar ? (
                                <img src={form.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <svg width={80} height={80} viewBox="0 0 100 100">
                                    <polygon points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30" fill="#ff4d4f" />
                                </svg>
                            )}
                        </Upload>
                        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 8 }}>只能上传jpg/png用户头像，且不超过500kb</div>
                    </Form.Item>

                    {/* 职责信息 */}
                    <div style={{ fontSize: 14, fontWeight: 600, margin: '24px 0 16px', color: 'rgba(0,0,0,0.85)' }}>职责信息</div>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="所属角色" required>
                                <Select
                                    mode="multiple"
                                    placeholder="请选择所属角色"
                                    value={form.roles || []}
                                    onChange={(vals) => setForm({ ...form, roles: vals as string[] })}
                                    options={roleOptions.map((r) => ({ label: r, value: r }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="所属部门" required>
                                <TreeSelect
                                    value={form.mainOrg || undefined}
                                    onChange={(v) => setForm({ ...form, mainOrg: v })}
                                    placeholder="请选择所属部门"
                                    treeData={orgTreeSelectData}
                                    style={{ width: '100%' }}
                                    treeDefaultExpandAll
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="所属岗位" required>
                                <Select
                                    mode="multiple"
                                    placeholder="请选择所属岗位"
                                    value={form.positions || []}
                                    onChange={(vals) => setForm({ ...form, positions: vals as string[] })}
                                    options={positionOptions.map((p) => ({ label: p, value: p }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Drawer>


            {/* 角色配置对话框（批量） */}
            <Modal
                open={roleConfigOpen}
                title="角色配置"
                onCancel={() => setRoleConfigOpen(false)}
                onOk={handleRoleConfigConfirm}
                okText="确定配置"
                okButtonProps={{ disabled: selectedIds.size === 0 }}
                width={560}
            >
                <div style={{ marginBottom: 12, fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>
                    将为选中的 {selectedIds.size} 个用户统一配置以下角色（覆盖其原有角色）：
                </div>
                <Select
                    mode="multiple"
                    placeholder="请选择角色"
                    value={roleConfigValues}
                    onChange={(vals) => setRoleConfigValues(vals as string[])}
                    options={roleOptions.map((r) => ({ label: r, value: r }))}
                    style={{ width: '100%' }}
                />
            </Modal>

            {/* 职责配置侧滑抽屉 */}
            <Drawer
                open={respOpen}
                title="职责配置"
                onClose={() => setRespOpen(false)}
                width={720}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button onClick={() => setRespOpen(false)}>取消</Button>
                        <Button type="primary" onClick={handleResponsibilitySave}>保存</Button>
                    </div>
                }
            >
                {(() => {
                    const targetUser = respTargetIds.length === 1 ? users.find((u) => u.id === respTargetIds[0]) : undefined;
                    const allPositions = targetUser
                        ? Array.from(new Set([targetUser.mainPosition, ...(targetUser.partTimePositions || [])])).filter(Boolean)
                        : [];
                    return (
                        <Form layout="vertical" data-annotation-id="user-resp-drawer">
                            {/* 基础信息 */}
                            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'rgba(0,0,0,0.85)' }}>基础信息</div>
                            {targetUser ? (
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Form.Item label="用户姓名">
                                            <Input readOnly value={targetUser.name} style={{ background: '#f5f5f5' }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item label="手机号码">
                                            <Input readOnly value={targetUser.phone} style={{ background: '#f5f5f5' }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item label="所属部门">
                                            <Input readOnly value={targetUser.mainOrg} style={{ background: '#f5f5f5' }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="所属角色">
                                            <Input readOnly value={targetUser.roles.join('，')} style={{ background: '#f5f5f5' }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="所属岗位">
                                            <Input readOnly value={allPositions.join('，')} style={{ background: '#f5f5f5' }} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            ) : (
                                <>
                                    <div style={{ marginBottom: 12, padding: 12, background: '#f5f5f5', borderRadius: 6, fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>
                                        已选择 {respTargetIds.length} 位用户，将统一配置以下职责。
                                    </div>
                                    <Table
                                        size="small"
                                        rowKey="id"
                                        pagination={false}
                                        dataSource={users.filter((u) => respTargetIds.includes(u.id))}
                                        scroll={{ x: 'max-content', y: 220 }}
                                        columns={[
                                            { title: '用户姓名', dataIndex: 'name', key: 'name', width: 90, onCell: () => ({ style: { whiteSpace: 'nowrap' } }) },
                                            { title: '手机号码', dataIndex: 'phone', key: 'phone', onCell: () => ({ style: { whiteSpace: 'nowrap' } }) },
                                            { title: '所属部门', dataIndex: 'mainOrg', key: 'mainOrg', onCell: () => ({ style: { whiteSpace: 'nowrap' } }) },
                                            { title: '所属角色', key: 'roles', onCell: () => ({ style: { whiteSpace: 'nowrap' } }), render: (_, u) => u.roles.join('，') },
                                            {
                                                title: '所属岗位',
                                                key: 'positions',
                                                onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
                                                render: (_, u) =>
                                                    Array.from(new Set([u.mainPosition, ...(u.partTimePositions || [])]))
                                                        .filter(Boolean)
                                                        .join('，'),
                                            },
                                        ]}
                                    />
                                </>
                            )}

                            {/* 配置信息 */}
                            <div style={{ fontSize: 14, fontWeight: 600, margin: '24px 0 16px', color: 'rgba(0,0,0,0.85)' }}>配置信息</div>
                            <Form.Item label="管理工序">
                                <Checkbox.Group
                                    value={respForm.processes || []}
                                    onChange={(vals) => setRespForm({ ...respForm, processes: vals as string[] })}
                                    options={[
                                        { label: '一线原料', value: '一线原料' },
                                        { label: '二线原料', value: '二线原料' },
                                        { label: '一线烧成', value: '一线烧成' },
                                        { label: '一线制成', value: '一线制成' },
                                        { label: '二线制成', value: '二线制成' },
                                        { label: '一线其他', value: '一线其他' },
                                        { label: '二线烧成', value: '二线烧成' },
                                        { label: '二线其他', value: '二线其他' },
                                    ]}
                                />
                            </Form.Item>
                            <Form.Item label="管理设备">
                                <TreeSelect
                                    treeCheckable
                                    showSearch
                                    treeNodeFilterProp="title"
                                    placeholder="请选择管理设备（支持按名称/编码搜索）"
                                    value={respForm.equipment || []}
                                    onChange={(vals) => setRespForm({ ...respForm, equipment: vals as string[] })}
                                    treeData={equipmentTreeData}
                                    style={{ width: '100%' }}
                                    treeDefaultExpandAll
                                    allowClear
                                    maxTagCount="responsive"
                                />
                            </Form.Item>
                            <Form.Item label="维修职责">
                                <Checkbox.Group
                                    value={respForm.maintenance || []}
                                    onChange={(vals) => setRespForm({ ...respForm, maintenance: vals as string[] })}
                                    options={[
                                        { label: '机械施工负责人', value: '机械施工负责人' },
                                        { label: '机械项目负责人', value: '机械项目负责人' },
                                        { label: '机械技术负责人', value: '机械技术负责人' },
                                        { label: '机械安全负责人', value: '机械安全负责人' },
                                        { label: '电气施工负责人', value: '电气施工负责人' },
                                        { label: '电气项目负责人', value: '电气项目负责人' },
                                        { label: '电气技术负责人', value: '电气技术负责人' },
                                        { label: '电气安全负责人', value: '电气安全负责人' },
                                        { label: '工艺施工负责人', value: '工艺施工负责人' },
                                        { label: '工艺项目负责人', value: '工艺项目负责人' },
                                        { label: '工艺技术负责人', value: '工艺技术负责人' },
                                        { label: '工艺安全负责人', value: '工艺安全负责人' },
                                    ]}
                                />
                            </Form.Item>
                        </Form>
                    );
                })()}
            </Drawer>

            {/* 交接人确认对话框 */}
            <Modal
                open={handoverModalOpen}
                title="是否指定交接人？"
                onCancel={() => { setHandoverModalOpen(false); setHandoverAction(null); }}
                footer={null}
                width={480}
                zIndex={2000}
            >
                <div data-annotation-id="user-handover-modal" style={{ marginBottom: 16, fontSize: 14, color: 'rgba(0,0,0,0.65)' }}>
                    {handoverDesc}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => { setHandoverModalOpen(false); setHandoverAction(null); }}>取消</Button>
                    <Button type="default" onClick={handleHandoverNo}>否，直接执行</Button>
                    <Button type="primary" onClick={handleHandoverYes}>是，指定交接人</Button>
                </div>
            </Modal>

            {/* 解冻操作确认对话框 */}
            <Modal
                open={unfreezeModalOpen}
                title="确认解冻用户？"
                onCancel={() => { setUnfreezeModalOpen(false); setUnfreezeAction(null); }}
                footer={null}
                width={480}
                zIndex={2000}
            >
                <div data-annotation-id="user-unfreeze-modal" style={{ marginBottom: 16, fontSize: 14, color: 'rgba(0,0,0,0.65)' }}>
                    该操作将解冻用户，解冻后会取消此前为交接人设置的委托及相关配置。是否确认解冻？
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button onClick={() => { setUnfreezeModalOpen(false); setUnfreezeAction(null); }}>取消</Button>
                    <Button type="primary" onClick={() => {
                        setUnfreezeModalOpen(false);
                        unfreezeAction?.();
                        setUnfreezeAction(null);
                    }}>确认解冻</Button>
                </div>
            </Modal>

            {/* 交接人选择对话框 */}
            <Modal
                open={handoverSelectorOpen}
                title="选择人员"
                onCancel={() => { setHandoverSelectorOpen(false); setHandoverSelectedUser(null); setHandoverSearch(''); }}
                onOk={handleHandoverSelectConfirm}
                okButtonProps={{ disabled: !handoverSelectedUser }}
                width={720}
                bodyStyle={{ padding: 0 }}
                zIndex={2001}
            >
                <div style={{ display: 'flex', height: 420 }}>
                    {/* 左侧：组织架构 + 人员树 */}
                    <div style={{ flex: 1, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '12px 16px 8px', fontWeight: 500, color: '#1677ff', fontSize: 14 }}>用户列表</div>
                        <div style={{ padding: '0 12px 8px' }}>
                            <Input.Search
                                placeholder="搜索人员或组织..."
                                value={handoverSearch}
                                onChange={(e) => setHandoverSearch(e.target.value)}
                                allowClear
                            />
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 12px' }}>
                            <Tree
                                checkable
                                checkStrictly
                                checkedKeys={handoverSelectedUser ? [handoverSelectedUser] : []}
                                onCheck={(checked) => {
                                    const keys = (checked as { checked: string[] }).checked;
                                    // 只允许选中人员节点（以 u 开头），且仅单人
                                    const userKeys = keys.filter((k) => k.startsWith('u'));
                                    if (userKeys.length > 0) {
                                        setHandoverSelectedUser(userKeys[userKeys.length - 1]);
                                    } else {
                                        setHandoverSelectedUser(null);
                                    }
                                }}
                                expandedKeys={handoverExpandedKeys}
                                onExpand={(keys) => setHandoverExpandedKeys(keys as string[])}
                                treeData={((): DataNode[] => {
                                    const activeUsers = users.filter((u) => u.status === 'active');
                                    const searchLower = handoverSearch.toLowerCase();
                                    // 构建带人员的树：组织节点 + 人员叶子节点
                                    function buildPersonTree(nodes: DataNode[]): DataNode[] {
                                        return nodes.map((node) => {
                                            const orgName = String(node.title);
                                            const childOrgs = node.children ? buildPersonTree(node.children) : [];
                                            const childUsers = activeUsers
                                                .filter((u) => u.mainOrg === orgName)
                                                .filter((u) => !searchLower || u.name.toLowerCase().includes(searchLower) || u.mainOrg.toLowerCase().includes(searchLower))
                                                .map((u) => ({
                                                    key: u.id,
                                                    title: (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                            <Avatar size={20} style={{ fontSize: 10, flexShrink: 0 }}>{u.name[0]}</Avatar>
                                                            <span>{u.name}</span>
                                                            <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>{u.mainPosition}</span>
                                                        </span>
                                                    ),
                                                    isLeaf: true,
                                                } as DataNode));
                                            const allChildren = [...childOrgs, ...childUsers];
                                            // 搜索时过滤：如果自身匹配则保留全部子节点，否则只保留匹配的子节点
                                            const selfMatch = !searchLower || orgName.toLowerCase().includes(searchLower);
                                            if (!selfMatch && allChildren.length === 0) return null as any;
                                            return {
                                                key: node.key,
                                                title: orgName,
                                                checkable: false,
                                                children: allChildren,
                                            } as DataNode;
                                        }).filter(Boolean);
                                    }
                                    return buildPersonTree(orgTreeData);
                                })()}
                            />
                        </div>
                    </div>
                    {/* 右侧：已选人员 */}
                    <div style={{ width: 240, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '12px 16px 8px', fontWeight: 500, fontSize: 14 }}>
                            已选择（{handoverSelectedUser ? 1 : 0}）
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', padding: '0 12px' }}>
                            {handoverSelectedUser ? (() => {
                                const u = users.find((x) => x.id === handoverSelectedUser);
                                if (!u) return null;
                                return (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '8px 10px', borderRadius: 6, border: '1px solid #f0f0f0', marginTop: 4,
                                    }}>
                                        <Avatar size={24} style={{ fontSize: 12, flexShrink: 0 }}>{u.name[0]}</Avatar>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                                            <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.mainOrg}</div>
                                        </div>
                                        <Button type="text" size="small" danger icon={<Trash2 size={12} />} onClick={() => setHandoverSelectedUser(null)} />
                                    </div>
                                );
                            })() : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(0,0,0,0.25)', fontSize: 13 }}>暂未选择</div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
