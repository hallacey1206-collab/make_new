import React, { useState } from 'react';
import {
    KeyRound,
    Play,
    Save,
    Plus,
    Trash2,
    Edit,
    Copy,
    Eye,
    History,
    RefreshCw,
    Settings,
    Shield,
} from 'lucide-react';
import {
    Tabs,
    Button,
    Input,
    Modal,
    Tag,
    Table,
    Space,
    Radio,
    Form,
    Row,
    Col,
    Select,
    Popconfirm,
    message,
    InputNumber,
    Drawer,
    Divider,
    Checkbox,
    Timeline,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TablePaginationConfig } from 'antd/es/table';

interface MenuItem {
    id: string;
    name: string;
    route: string;
    code: string;
    alias: string;
    enabled: boolean;
    sort: number;
    parentId?: string;
    icon?: string;
    type?: string;
    newWindow?: boolean;
    external?: boolean;
    remark?: string;
    children?: MenuItem[];
}

const initialMenuData: MenuItem[] = [
    { id: '1', name: '驾驶舱', route: '/gongmao', code: 'large_screen', alias: '驾驶舱', enabled: false, sort: 0 },
    { id: '2', name: '大屏轮播', route: '/largeScreenCarousel/index', code: 'largeScreenCarousel', alias: '大屏轮播', enabled: true, sort: 1 },
    { id: '3', name: '大屏轮播', route: '/largeScreenCarouselComponent/index?code=SCENE_20250616_03', code: 'SCENE_20250616_03', alias: 'SCENE_20250616_03', enabled: false, sort: 3 },
    {
        id: '4', name: '工厂大屏', route: '/LargeScreen', code: 'LargeScreen', alias: '工厂大屏', enabled: false, sort: 4,
        children: [
            { id: '4-1', name: '工作台', route: '/desk', code: 'desk', alias: '工作台', enabled: false, sort: 1 },
            { id: '4-2', name: '生产监视', route: '/base01', code: 'base001', alias: '生产监视', enabled: false, sort: 2 },
            { id: '4-3', name: '远程辅助巡检', route: '/newRemoteInspection', code: 'newRemoteInspection_PC', alias: 'newRemoteInspection', enabled: false, sort: 2 },
            { id: '4-4', name: '生产管理', route: '/pm', code: '/pm', alias: '生产管理', enabled: false, sort: 3 },
            { id: '4-5', name: '设备管理', route: '/equipment', code: 'equipment', alias: '设备管理', enabled: false, sort: 3 },
            { id: '4-6', name: '质量管理', route: 'qm', code: 'qm', alias: '质量管理', enabled: false, sort: 4 },
        ],
    },
    { id: '5', name: '视频监控', route: 'https://212.126.96.90/#/dHNUYWlI...', code: 'videoSurveillance', alias: '视频监控', enabled: false, sort: 6 },
];

type PolicyType = 'org' | 'dimension' | 'userAttr' | 'sql';
type PolicyStatus = 'active' | 'inactive';

interface DataPolicy {
    id: string;
    name: string;
    code: string;
    entities: string[];
    type: PolicyType;
    status: PolicyStatus;
    lastModified: string;
    description?: string;
    ruleConfig?: any;
}

const initialDataPolicies: DataPolicy[] = [
    { id: 'dp1a', name: '巡检人员查看权限', code: 'data_scope_inspection_self', entities: ['巡检任务', '巡检记录'], type: 'userAttr', status: 'active', lastModified: '2024-06-15 10:20:00', description: '巡检人员只可查看指派给自己的巡检任务和由自己执行的巡检记录', ruleConfig: { userAttrRule: 'selfOnly', baseScope: 'self', groups: [{ logic: 'AND', conditions: [{ matchMode: 'userAttr', valueSource: 'fixed', userAttrField: '当前用户', operator: 'eq', dataField: '巡检人/执行人' }] }] } },
    { id: 'dp1b', name: '领导层巡检查看权限', code: 'data_scope_inspection_leader', entities: ['巡检任务', '巡检记录'], type: 'userAttr', status: 'active', lastModified: '2024-06-15 10:25:00', description: '领导层可查看本人及下属的任务和记录', ruleConfig: { userAttrRule: 'selfAndSubordinate', baseScope: 'selfAndChildren', groups: [{ logic: 'AND', conditions: [{ matchMode: 'userAttr', valueSource: 'fixed', userAttrField: '当前用户及下属', operator: 'eq', dataField: '巡检人/执行人' }] }] } },
    { id: 'dp2', name: '车间维修工单查看权限', code: 'data_scope_workshop_repair', entities: ['设备维修工单', '维修计划'], type: 'dimension', status: 'active', lastModified: '2024-06-10 14:30:00', description: '各个车间主任只可查看自己可访问的产线工段下的设备维修工单和维修计划，以及审批流程中由自己处理过的维修工单和维修计划；领导层可以查看全部记录', ruleConfig: { groups: [{ logic: 'AND', conditions: [{ matchMode: 'userAttr', field: 'device.production_line', operator: 'eq', userAttr: 'accessibleProductionLines' }, { matchMode: 'list', field: 'workorder.creator_id', operator: 'eq', valueSource: 'userAttr', userAttrList: 'accessibleProductionLines' }] }] } },
    { id: 'dp3', name: '物料类型用料申请权限', code: 'data_scope_material_requisition', entities: ['用料申请单'], type: 'dimension', status: 'active', lastModified: '2024-05-25 09:00:00', description: '管电气物料的库管员只查看电气类物料的用料申请单，管机械物料的库管员只查看机械类物料的用料申请单，仓库主任可查看所有的用料申请单' },
    { id: 'dp4', name: '车间润滑任务查看权限', code: 'data_scope_lubrication', entities: ['润滑任务', '润滑记录'], type: 'dimension', status: 'active', lastModified: '2024-05-18 16:45:00', description: '各个车间主任只查看自己可访问的产线工段下的润滑任务和润滑记录，领导层可查看全部记录' },
];

const POLICY_REFERENCES: Record<string, { role: string; org?: string }[]> = {
    dp1a: [
        { role: '巡检员', org: 'DCC水泥厂' },
    ],
    dp1b: [
        { role: '车间主任', org: 'DCC水泥厂' },
        { role: '生产经理', org: 'DCC水泥厂' },
    ],
    dp2: [
        { role: '生产经理', org: 'DCC水泥厂' },
    ],
};

const fieldPermDemo = [
    { id: 'fp1', entity: '设备档案-子设备', field: '专业类型', role: '设备工程师', rule: '可见/可编辑' },
    { id: 'fp2', entity: '设备档案-子设备', field: '型号/规格', role: '设备工程师', rule: '专业类型为电气时可编辑' },
    { id: 'fp3', entity: '化验单', field: '配方成本', role: '财务经理', rule: '仅财务经理可见' },
    { id: 'fp4', entity: '用户档案', field: '手机号', role: '全部', rule: '脱敏：中间四位星号' },
    { id: 'fp5', entity: '用户档案', field: '身份证号', role: '全部', rule: '脱敏：中间八位星号' },
];

// ===== 字段权限相关类型 =====
type FieldPermissionType = 'hidden' | 'readonly' | 'editable';
type ConditionType = 'userAttr' | 'role' | 'custom';
type MaskingType = 'none' | 'phone' | 'idCard' | 'custom';

interface ConditionPermission {
    id: string;
    name?: string;
    conditionType: ConditionType;
    config: any;
    permission: FieldPermissionType;
    priority: number;
}

interface FieldConfig {
    fieldName: string;
    fieldLabel: string;
    fieldType: string;
    defaultPermission: FieldPermissionType;
    conditions: ConditionPermission[];
    maskingRule: MaskingType;
    maskingCustom?: string;
}

interface FieldRule {
    id: string;
    name: string;
    code: string;
    entity: string;
    description?: string;
    status: 'active' | 'inactive';
    lastModified: string;
    fieldConfigs: FieldConfig[];
}

const ENTITY_META: Record<string, { label: string; fields: { name: string; label: string; type: string }[] }> = {
    '设备档案': {
        label: '设备档案',
        fields: [
            { name: 'deviceCode', label: '设备编码', type: '文本' },
            { name: 'deviceName', label: '设备名称', type: '文本' },
            { name: 'workSection', label: '所属工段', type: '文本' },
            { name: 'deviceModel', label: '设备型号', type: '文本' },
            { name: 'manufacturer', label: '生产厂家', type: '文本' },
            { name: 'wearParts', label: '易损部件', type: '文本' },
            { name: 'processParams', label: '工艺参数', type: '对象' },
        ],
    },
    '设备档案-子设备': {
        label: '设备档案-子设备',
        fields: [
            { name: 'deviceCode', label: '设备编码', type: '文本' },
            { name: 'deviceName', label: '设备名称', type: '文本' },
            { name: 'subDeviceCode', label: '子设备编码', type: '文本' },
            { name: 'subDeviceName', label: '子设备名称', type: '文本' },
            { name: 'professionType', label: '专业类型', type: '枚举' },
            { name: 'specModel', label: '型号/规格', type: '文本' },
            { name: 'processParams', label: '工艺参数', type: '对象' },
        ],
    },
    '维修工单': {
        label: '维修工单',
        fields: [
            { name: 'woNo', label: '工单编号', type: '文本' },
            { name: 'deviceCode', label: '设备编码', type: '文本' },
            { name: 'deviceName', label: '设备名称', type: '文本' },
            { name: 'woSource', label: '工单来源', type: '枚举' },
            { name: 'relatedRecord', label: '关联记录', type: '文本' },
            { name: 'repairLocation', label: '维修位置', type: '文本' },
            { name: 'repairContent', label: '维修内容', type: '文本' },
            { name: 'professionType', label: '专业类型', type: '枚举' },
            { name: 'planStartTime', label: '计划开始时间', type: '日期时间' },
            { name: 'planEndTime', label: '计划结束时间', type: '日期时间' },
            { name: 'planWorkHours', label: '计划工时', type: '数值' },
            { name: 'mainTools', label: '主要工具', type: '文本' },
            { name: 'lockoutTagout', label: '停电上锁', type: '枚举' },
            { name: 'constructionLeader', label: '施工负责人', type: '人员' },
            { name: 'safetyLeader', label: '安全负责人', type: '人员' },
            { name: 'projectLeader', label: '项目负责人', type: '人员' },
            { name: 'techLeader', label: '技术负责人', type: '人员' },
            { name: 'publisher', label: '发布人', type: '人员' },
            { name: 'remark', label: '备注', type: '文本' },
            { name: 'materialRequisition', label: '物料领用', type: '对象' },
            { name: 'repairPlan', label: '维修方案', type: '文本' },
        ],
    },
};

const initialFieldRules: FieldRule[] = [
    {
        id: 'fr1',
        name: '设备档案字段权限',
        code: 'field_perm_device',
        entity: '设备档案',
        description: '限制设备档案中生产厂家、易损部件等敏感字段的可见性和编辑权限',
        status: 'active',
        lastModified: '2024-06-10 10:30:00',
        fieldConfigs: [
            { fieldName: 'workSection', fieldLabel: '所属工段', fieldType: '文本', defaultPermission: 'editable', conditions: [], maskingRule: 'none' },
            { fieldName: 'deviceCode', fieldLabel: '设备编码', fieldType: '文本', defaultPermission: 'readonly', conditions: [
                { id: 'c1', conditionType: 'role', config: { roles: ['客服'] }, permission: 'editable', priority: 1 },
            ], maskingRule: 'none' },
            { fieldName: 'manufacturer', fieldLabel: '生产厂家', fieldType: '文本', defaultPermission: 'hidden', conditions: [
                { id: 'c2', conditionType: 'role', config: { roles: ['财务经理'] }, permission: 'readonly', priority: 1 },
                { id: 'c3', conditionType: 'userAttr', config: { attr: '岗位', operator: 'eq', value: '总监' }, permission: 'readonly', priority: 2 },
            ], maskingRule: 'none' },
        ],
    },
    {
        id: 'fr2',
        name: '设备档案-子设备字段权限',
        code: 'field_perm_sub_device',
        entity: '设备档案-子设备',
        description: '设备档案子设备的专业类型和型号/规格仅设备工程师可编辑',
        status: 'active',
        lastModified: '2024-06-08 14:20:00',
        fieldConfigs: [
            { fieldName: 'professionType', fieldLabel: '专业类型', fieldType: '枚举', defaultPermission: 'readonly', conditions: [
                { id: 'c4', conditionType: 'role', config: { roles: ['设备工程师', '工厂管理员'] }, permission: 'editable', priority: 1 },
            ], maskingRule: 'none' },
            { fieldName: 'specModel', fieldLabel: '型号/规格', fieldType: '文本', defaultPermission: 'readonly', conditions: [
                { id: 'c5', conditionType: 'role', config: { roles: ['设备工程师'] }, permission: 'editable', priority: 1 },
            ], maskingRule: 'none' },
        ],
    },
    {
        id: 'fr3',
        name: '维修工单字段权限',
        code: 'field_perm_wo',
        entity: '维修工单',
        description: '维修工单物料领用仅管理层可见',
        status: 'inactive',
        lastModified: '2024-05-20 09:15:00',
        fieldConfigs: [
            { fieldName: 'materialRequisition', fieldLabel: '物料领用', fieldType: '对象', defaultPermission: 'hidden', conditions: [
                { id: 'c6', conditionType: 'role', config: { roles: ['工厂管理员', '财务经理'] }, permission: 'readonly', priority: 1 },
            ], maskingRule: 'none' },
        ],
    },
];

const FIELD_RULE_REFERENCES: Record<string, { role: string; overrideCount: number }[]> = {
    fr1: [
        { role: '工厂管理员', overrideCount: 2 },
        { role: '设备检修审批', overrideCount: 0 },
    ],
    fr2: [
        { role: '销售经理', overrideCount: 1 },
        { role: '财务经理', overrideCount: 2 },
    ],
};

const PERMISSION_LABEL: Record<FieldPermissionType, string> = {
    hidden: '隐藏',
    readonly: '只读',
    editable: '可编辑',
};

const PERMISSION_COLOR: Record<FieldPermissionType, string> = {
    hidden: 'error',
    readonly: 'warning',
    editable: 'success',
};

const MASKING_LABEL: Record<MaskingType, string> = {
    none: '无',
    phone: '手机号脱敏',
    idCard: '身份证脱敏',
    custom: '自定义正则',
};

const CONDITION_TYPE_LABEL: Record<ConditionType, string> = {
    userAttr: '用户属性匹配',
    role: '角色匹配',
    custom: '自定义表达式',
};

const ENTITY_OPTIONS = ['设备', '维修工单', '待办事项', '销售订单', '物料库存', '窑系统运行记录', '工厂产量记录'];
const DIMENSION_OPTIONS = ['产线', '仓库', '区域', '客户等级', '物料类型'];
const ORG_TYPE_OPTIONS = ['集团', '公司', '工厂', '部门', '二级部门'];

const typeMap: Record<PolicyType, string> = {
    org: '组织与层级',
    dimension: '维度列表',
    userAttr: '用户属性',
    sql: '自定义SQL条件',
};

export default function PermissionPage() {
    const [activeTab, setActiveTab] = useState<'function' | 'data' | 'field'>('function');
    const [menuData, setMenuData] = useState<MenuItem[]>(initialMenuData);
    const [menuModalOpen, setMenuModalOpen] = useState(false);
    const [menuForm] = Form.useForm();
    const [menuSearchName, setMenuSearchName] = useState('');
    const [menuSearchCode, setMenuSearchCode] = useState('');
    const [menuSearchAlias, setMenuSearchAlias] = useState('');
    const [fieldPerms] = useState(fieldPermDemo);

    const [dataPolicies, setDataPolicies] = useState<DataPolicy[]>(initialDataPolicies);
    const [dataPolicyDrawerOpen, setDataPolicyDrawerOpen] = useState(false);
    const [dataPolicyForm] = Form.useForm();
    const [dataPolicyEditing, setDataPolicyEditing] = useState<DataPolicy | null>(null);
    const [dataPolicySearchName, setDataPolicySearchName] = useState('');
    const [dataPolicySearchCode, setDataPolicySearchCode] = useState('');
    const [dataPolicyStatusFilter, setDataPolicyStatusFilter] = useState<string | undefined>(undefined);
    const [dataPolicyPagination, setDataPolicyPagination] = useState<TablePaginationConfig>({ current: 1, pageSize: 10, total: initialDataPolicies.length });
    const [dataPolicyTestOpen, setDataPolicyTestOpen] = useState(false);
    const [dataPolicyTestUser, setDataPolicyTestUser] = useState('');
    const [dataPolicyTestResult, setDataPolicyTestResult] = useState<string | null>(null);
    const [dataPolicyRefOpen, setDataPolicyRefOpen] = useState(false);
    const [dataPolicyRefId, setDataPolicyRefId] = useState<string | null>(null);
    const [dataPolicyLogOpen, setDataPolicyLogOpen] = useState(false);
    const [dataPolicyLogId, setDataPolicyLogId] = useState<string | null>(null);

    // ===== 字段权限状态 =====
    const [fieldRules, setFieldRules] = useState<FieldRule[]>(initialFieldRules);
    const [fieldSearchName, setFieldSearchName] = useState('');
    const [fieldSearchEntity, setFieldSearchEntity] = useState('');
    const [fieldStatusFilter, setFieldStatusFilter] = useState<string | undefined>(undefined);
    const [fieldDrawerOpen, setFieldDrawerOpen] = useState(false);
    const [fieldEditing, setFieldEditing] = useState<FieldRule | null>(null);
    const [fieldForm] = Form.useForm();
    const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
    const [fieldConfigEntity, setFieldConfigEntity] = useState<string>('');
    const [fieldRefOpen, setFieldRefOpen] = useState(false);
    const [fieldRefId, setFieldRefId] = useState<string | null>(null);
    const [fieldLogOpen, setFieldLogOpen] = useState(false);
    const [fieldLogId, setFieldLogId] = useState<string | null>(null);
    const [conditionModalOpen, setConditionModalOpen] = useState(false);
    const [conditionEditingField, setConditionEditingField] = useState<string | null>(null);
    const [conditionEditingId, setConditionEditingId] = useState<string | null>(null);
    const [conditionForm] = Form.useForm();
    const [maskingModalOpen, setMaskingModalOpen] = useState(false);
    const [maskingEditingField, setMaskingEditingField] = useState<string | null>(null);
    const [maskingForm] = Form.useForm();
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewForm] = Form.useForm();
    const [previewResult, setPreviewResult] = useState<{ fieldName: string; label: string; finalPermission: FieldPermissionType; masking: string }[] | null>(null);

    const handleDeleteMenu = (id: string) => {
        const removeById = (items: MenuItem[]): MenuItem[] => {
            return items
                .filter((item) => item.id !== id)
                .map((item) => {
                    if (item.children) {
                        return { ...item, children: removeById(item.children) };
                    }
                    return item;
                });
        };
        setMenuData((prev) => removeById(prev));
        message.success('删除成功');
    };

    const handleDeleteDataPolicy = (record: DataPolicy) => {
        if (record.status === 'active') {
            message.error('仅停用状态下的策略才允许删除');
            return;
        }
        const refs = POLICY_REFERENCES[record.id];
        if (refs && refs.length > 0) {
            message.error(`该策略已被 ${refs.length} 个角色引用，无法删除`);
            return;
        }
        setDataPolicies((prev) => prev.filter((p) => p.id !== record.id));
        message.success('删除成功');
    };

    const handleCopyDataPolicy = (record: DataPolicy) => {
        setDataPolicyEditing(null);
        dataPolicyForm.setFieldsValue({
            name: `${record.name}_copy`,
            code: `${record.code}_copy`,
            entities: record.entities,
            type: record.type,
            description: record.description,
            status: 'inactive',
            ruleConfig: record.ruleConfig,
        });
        setDataPolicyDrawerOpen(true);
    };

    const handleSaveDataPolicy = () => {
        dataPolicyForm.validateFields().then((values) => {
            if (dataPolicyEditing) {
                setDataPolicies((prev) =>
                    prev.map((p) => (p.id === dataPolicyEditing.id ? { ...p, ...values, lastModified: new Date().toISOString().slice(0, 19).replace('T', ' ') } : p))
                );
                message.success('保存成功');
            } else {
                const newPolicy: DataPolicy = {
                    id: `dp-${Date.now()}`,
                    ...values,
                    lastModified: new Date().toISOString().slice(0, 19).replace('T', ' '),
                };
                setDataPolicies((prev) => [...prev, newPolicy]);
                message.success('新建成功');
            }
            setDataPolicyDrawerOpen(false);
        });
    };

    const handleTestPolicy = () => {
        if (!dataPolicyTestUser) return;
        setDataPolicyTestResult(`用户 "${dataPolicyTestUser}" 的数据权限策略测试结果：\n- 匹配策略：工厂数据权限\n- 生效范围：本组织及下级组织\n- 过滤条件：org_id IN (SELECT id FROM org WHERE path LIKE '1/%')\n- 预估影响数据量：1,247 条`);
    };

    const handleToggleStatus = (record: DataPolicy) => {
        const nextStatus = record.status === 'active' ? 'inactive' : 'active';
        setDataPolicies((prev) =>
            prev.map((p) => (p.id === record.id ? { ...p, status: nextStatus, lastModified: new Date().toISOString().slice(0, 19).replace('T', ' ') } : p))
        );
        message.success(`已${nextStatus === 'active' ? '启用' : '停用'}策略「${record.name}」`);
    };

    // ===== 字段权限处理函数 =====
    const filteredFieldRules = fieldRules.filter((r) => {
        if (fieldSearchName && !r.name.includes(fieldSearchName)) return false;
        if (fieldSearchEntity && r.entity !== fieldSearchEntity) return false;
        if (fieldStatusFilter && r.status !== fieldStatusFilter) return false;
        return true;
    });

    const handleSaveFieldRule = () => {
        fieldForm.validateFields().then((values) => {
            const payload = { ...values, fieldConfigs };
            if (fieldEditing) {
                setFieldRules((prev) =>
                    prev.map((r) => (r.id === fieldEditing.id ? { ...r, ...payload, lastModified: new Date().toISOString().slice(0, 19).replace('T', ' ') } : r))
                );
                message.success('保存成功');
            } else {
                const newRule: FieldRule = {
                    id: `fr-${Date.now()}`,
                    ...payload,
                    lastModified: new Date().toISOString().slice(0, 19).replace('T', ' '),
                };
                setFieldRules((prev) => [...prev, newRule]);
                message.success('新建成功');
            }
            setFieldDrawerOpen(false);
        });
    };

    const handleCopyFieldRule = (record: FieldRule) => {
        setFieldEditing(null);
        fieldForm.setFieldsValue({
            name: `${record.name}_copy`,
            code: `${record.code}_copy`,
            entity: record.entity,
            description: record.description,
            status: 'inactive',
        });
        setFieldConfigs(record.fieldConfigs.map((fc) => ({ ...fc, conditions: fc.conditions.map((c) => ({ ...c, id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` })) })));
        setFieldConfigEntity(record.entity);
        setFieldDrawerOpen(true);
    };

    const handleDeleteFieldRule = (record: FieldRule) => {
        if (record.status === 'active') {
            message.error('仅停用状态下的规则才允许删除');
            return;
        }
        const refs = FIELD_RULE_REFERENCES[record.id];
        if (refs && refs.length > 0) {
            message.error(`该规则已被 ${refs.length} 个角色引用，无法删除`);
            return;
        }
        setFieldRules((prev) => prev.filter((r) => r.id !== record.id));
        message.success('删除成功');
    };

    const handleToggleFieldStatus = (record: FieldRule) => {
        const nextStatus = record.status === 'active' ? 'inactive' : 'active';
        setFieldRules((prev) =>
            prev.map((r) => (r.id === record.id ? { ...r, status: nextStatus, lastModified: new Date().toISOString().slice(0, 19).replace('T', ' ') } : r))
        );
        message.success(`已${nextStatus === 'active' ? '启用' : '停用'}规则「${record.name}」`);
    };

    const syncFieldsFromEntity = (entity: string) => {
        const meta = ENTITY_META[entity];
        if (!meta) {
            message.warning('该业务对象暂无元数据');
            return;
        }
        const existingMap = new Map(fieldConfigs.map((fc) => [fc.fieldName, fc]));
        const merged = meta.fields.map((f) => {
            const existing = existingMap.get(f.name);
            if (existing) return existing;
            return {
                fieldName: f.name,
                fieldLabel: f.label,
                fieldType: f.type,
                defaultPermission: 'editable' as FieldPermissionType,
                conditions: [],
                maskingRule: 'none' as MaskingType,
            };
        });
        setFieldConfigs(merged);
        message.success(`已同步 ${meta.fields.length} 个字段`);
    };

    const openFieldDrawer = (record?: FieldRule) => {
        if (record) {
            setFieldEditing(record);
            fieldForm.setFieldsValue({
                name: record.name,
                code: record.code,
                entity: record.entity,
                description: record.description,
                status: record.status,
            });
            setFieldConfigs(record.fieldConfigs.map((fc) => ({ ...fc })));
            setFieldConfigEntity(record.entity);
        } else {
            setFieldEditing(null);
            fieldForm.resetFields();
            fieldForm.setFieldsValue({ status: 'inactive' });
            setFieldConfigs([]);
            setFieldConfigEntity('');
        }
        setFieldDrawerOpen(true);
    };

    const handlePreview = () => {
        const values = previewForm.getFieldsValue();
        const mockRoles: string[] = values.mockRoles || [];
        const mockPosition = values.mockPosition || '';

        const result = fieldConfigs.map((fc) => {
            let finalPermission = fc.defaultPermission;
            const sortedConditions = [...fc.conditions].sort((a, b) => a.priority - b.priority);
            for (const cond of sortedConditions) {
                let matched = false;
                if (cond.conditionType === 'role') {
                    matched = cond.config.roles?.some((r: string) => mockRoles.includes(r));
                } else if (cond.conditionType === 'userAttr') {
                    if (cond.config.attr === '岗位') matched = mockPosition === cond.config.value;
                }
                if (matched) {
                    finalPermission = cond.permission;
                    break;
                }
            }
            return {
                fieldName: fc.fieldName,
                label: fc.fieldLabel,
                finalPermission,
                masking: MASKING_LABEL[fc.maskingRule],
            };
        });
        setPreviewResult(result);
    };

    const filteredDataPolicies = dataPolicies.filter((p) => {
        if (dataPolicySearchName && !p.name.includes(dataPolicySearchName)) return false;
        if (dataPolicySearchCode && !p.code.includes(dataPolicySearchCode)) return false;
        if (dataPolicyStatusFilter && p.status !== dataPolicyStatusFilter) return false;
        return true;
    });

    const dataPolicyColumns: ColumnsType<DataPolicy> = [
        { title: '策略名称', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name), render: (v: string) => <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span> },
        { title: '策略编码', dataIndex: 'code', sorter: (a, b) => a.code.localeCompare(b.code), render: (v: string) => <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>{v}</span> },
        { title: '适用业务对象', dataIndex: 'entities', render: (v: string[]) => <Space size={4}>{v.map((e) => <Tag key={e} style={{ fontSize: 12 }}>{e}</Tag>)}</Space> },
        { title: '策略类型', dataIndex: 'type', render: (v: PolicyType) => typeMap[v] },
        {
            title: '状态',
            dataIndex: 'status',
            sorter: (a, b) => a.status.localeCompare(b.status),
            render: (v: PolicyStatus) => <Tag color={v === 'active' ? 'success' : 'default'}>{v === 'active' ? '启用' : '停用'}</Tag>,
        },
        { title: '最后修改时间', dataIndex: 'lastModified', sorter: (a, b) => a.lastModified.localeCompare(b.lastModified) },
        {
            title: '操作',
            key: 'action',
            width: 320,
            render: (_, record) => (
                <Space size={4}>
                    <Button type="link" size="small" disabled={record.status === 'active'} onClick={() => { setDataPolicyEditing(record); dataPolicyForm.setFieldsValue({ ...record }); setDataPolicyDrawerOpen(true); }}>编辑</Button>
                    <Popconfirm
                        title={`确定要${record.status === 'active' ? '停用' : '启用'}该策略吗？`}
                        onConfirm={() => handleToggleStatus(record)}
                    >
                        <Button type="link" size="small">{record.status === 'active' ? '停用' : '启用'}</Button>
                    </Popconfirm>
                    <Button type="link" size="small" onClick={() => handleCopyDataPolicy(record)}>复制</Button>
                    <Button type="link" size="small" icon={<Eye size={12} />} onClick={() => { setDataPolicyRefId(record.id); setDataPolicyRefOpen(true); }}>引用</Button>
                    <Button type="link" size="small" icon={<History size={12} />} onClick={() => { setDataPolicyLogId(record.id); setDataPolicyLogOpen(true); }}>日志</Button>
                    <Popconfirm title="确定删除该策略吗？" onConfirm={() => handleDeleteDataPolicy(record)}>
                        <Button type="link" size="small" danger disabled={record.status === 'active'}>删除</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const menuColumns: ColumnsType<MenuItem> = [
        { title: '菜单名称', dataIndex: 'name', render: (v: string) => <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span> },
        { title: '路由地址', dataIndex: 'route', render: (v: string) => <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>{v}</span> },
        { title: '菜单编号', dataIndex: 'code', render: (v: string) => <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>{v}</span> },
        { title: '菜单别名', dataIndex: 'alias' },
        {
            title: '是否启用',
            dataIndex: 'enabled',
            render: (v: boolean) => <Tag color={v ? 'success' : 'error'} style={{ fontSize: 11 }}>{v ? '是' : '否'}</Tag>,
        },
        { title: '菜单排序', dataIndex: 'sort' },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button type="link" size="small" icon={<Edit size={12} />}>编辑</Button>
                    <Button type="link" size="small" icon={<Plus size={12} />}>新增子项</Button>
                    <Popconfirm title="确定删除该菜单吗？" onConfirm={() => handleDeleteMenu(record.id)}>
                        <Button type="link" size="small" danger icon={<Trash2 size={12} />}>删除</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const fieldColumns: ColumnsType<any> = [
        { title: '业务对象', dataIndex: 'entity' },
        { title: '字段', dataIndex: 'field', render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
        { title: '角色', dataIndex: 'role' },
        { title: '权限规则', dataIndex: 'rule' },
        {
            title: '操作',
            key: 'action',
            render: () => (
                <Space>
                    <Button type="link" size="small">编辑</Button>
                    <Button type="link" size="small" danger>删除</Button>
                </Space>
            ),
        },
    ];

    const fieldRuleColumns: ColumnsType<FieldRule> = [
        { title: '规则名称', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name), render: (v: string) => <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span> },
        { title: '适用业务对象', dataIndex: 'entity' },
        {
            title: '状态',
            dataIndex: 'status',
            sorter: (a, b) => a.status.localeCompare(b.status),
            render: (v: string) => <Tag color={v === 'active' ? 'success' : 'default'}>{v === 'active' ? '启用' : '停用'}</Tag>,
        },
        { title: '最后修改时间', dataIndex: 'lastModified', sorter: (a, b) => a.lastModified.localeCompare(b.lastModified) },
        {
            title: '操作',
            key: 'action',
            width: 320,
            render: (_, record) => (
                <Space size={4}>
                    <Button type="link" size="small" disabled={record.status === 'active'} onClick={() => openFieldDrawer(record)}>编辑</Button>
                    <Popconfirm title={`确定要${record.status === 'active' ? '停用' : '启用'}该规则吗？`} onConfirm={() => handleToggleFieldStatus(record)}>
                        <Button type="link" size="small">{record.status === 'active' ? '停用' : '启用'}</Button>
                    </Popconfirm>
                    <Button type="link" size="small" onClick={() => handleCopyFieldRule(record)}>复制</Button>
                    <Button type="link" size="small" icon={<Eye size={12} />} onClick={() => { setFieldRefId(record.id); setFieldRefOpen(true); }}>引用</Button>
                    <Button type="link" size="small" icon={<History size={12} />} onClick={() => { setFieldLogId(record.id); setFieldLogOpen(true); }}>日志</Button>
                    <Popconfirm title="确定删除该规则吗？" onConfirm={() => handleDeleteFieldRule(record)}>
                        <Button type="link" size="small" danger disabled={record.status === 'active'}>删除</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const items = [
        {
            key: 'function',
            label: '功能权限',
            children: (
                <div>
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <Button type="primary" icon={<Plus size={14} />} onClick={() => { menuForm.resetFields(); setMenuModalOpen(true); }}>新增</Button>
                        <Button icon={<Trash2 size={14} />}>删除</Button>
                        <div style={{ flex: 1 }} />
                        <Input placeholder="请输入菜单名称" value={menuSearchName} onChange={(e) => setMenuSearchName(e.target.value)} style={{ width: 200 }} allowClear />
                        <Input placeholder="请输入菜单编号" value={menuSearchCode} onChange={(e) => setMenuSearchCode(e.target.value)} style={{ width: 200 }} allowClear />
                        <Input placeholder="请输入菜单别名" value={menuSearchAlias} onChange={(e) => setMenuSearchAlias(e.target.value)} style={{ width: 200 }} allowClear />
                    </div>
                    <div className="admin-card" style={{ padding: 0 }}>
                        <Table rowKey="id" columns={menuColumns} dataSource={menuData} pagination={false} defaultExpandAllRows />
                    </div>
                </div>
            ),
        },
        {
            key: 'data',
            label: <span data-annotation-id="annotation-16">数据权限</span>,
            children: (
                <div>
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <Button type="primary" icon={<Plus size={14} />} onClick={() => { setDataPolicyEditing(null); dataPolicyForm.resetFields(); dataPolicyForm.setFieldsValue({ status: 'inactive', type: 'org' }); setDataPolicyDrawerOpen(true); }}>新建策略</Button>
                        <div style={{ flex: 1 }} />
                        <Input placeholder="搜索策略名称" value={dataPolicySearchName} onChange={(e) => setDataPolicySearchName(e.target.value)} style={{ width: 180 }} allowClear />
                        <Input placeholder="搜索策略编码" value={dataPolicySearchCode} onChange={(e) => setDataPolicySearchCode(e.target.value)} style={{ width: 180 }} allowClear />
                        <Select placeholder="筛选状态" value={dataPolicyStatusFilter} onChange={(v) => setDataPolicyStatusFilter(v)} style={{ width: 120 }} allowClear>
                            <Select.Option value="active">启用</Select.Option>
                            <Select.Option value="inactive">停用</Select.Option>
                        </Select>
                    </div>
                    <div className="admin-card" style={{ padding: 0 }}>
                        <Table
                            rowKey="id"
                            columns={dataPolicyColumns}
                            dataSource={filteredDataPolicies}
                            pagination={dataPolicyPagination}
                            onChange={(pagination) => setDataPolicyPagination(pagination)}
                        />
                    </div>
                </div>
            ),
        },
        {
            key: 'field',
            label: <span data-annotation-id="annotation-15">字段权限</span>,
            children: (
                <div>
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <Button type="primary" icon={<Plus size={14} />} onClick={() => openFieldDrawer()}>新建规则</Button>
                        <div style={{ flex: 1 }} />
                        <Input placeholder="搜索规则名称" value={fieldSearchName} onChange={(e) => setFieldSearchName(e.target.value)} style={{ width: 180 }} allowClear />
                        <Select placeholder="筛选业务对象" value={fieldSearchEntity || undefined} onChange={(v) => setFieldSearchEntity(v)} style={{ width: 160 }} allowClear>
                            {Object.keys(ENTITY_META).map((e) => (
                                <Select.Option key={e} value={e}>{e}</Select.Option>
                            ))}
                        </Select>
                        <Select placeholder="筛选状态" value={fieldStatusFilter} onChange={(v) => setFieldStatusFilter(v)} style={{ width: 120 }} allowClear>
                            <Select.Option value="active">启用</Select.Option>
                            <Select.Option value="inactive">停用</Select.Option>
                        </Select>
                    </div>
                    <div className="admin-card" style={{ padding: 0 }}>
                        <Table rowKey="id" columns={fieldRuleColumns} dataSource={filteredFieldRules} pagination={false} />
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div data-annotation-id="permission-tabs">
            <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k as any)} items={items} />

            <Modal open={menuModalOpen} title="菜单新增" onCancel={() => setMenuModalOpen(false)} width={900} footer={null}>
                <Form form={menuForm} layout="vertical">
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="name" label="菜单名称" rules={[{ required: true, message: '请输入菜单名称' }]}>
                                <Input placeholder="请输入菜单名称" maxLength={500} showCount />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="route" label="路由地址" rules={[{ required: true, message: '请输入路由地址' }]}>
                                <Input placeholder="请输入路由地址" maxLength={500} showCount />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="parentId" label="上级菜单">
                                <Select placeholder="请选择上级菜单" allowClear>
                                    <Select.Option value="4">工厂大屏</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="icon" label="菜单图标">
                                <Input placeholder="请选择菜单图标" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="code" label="菜单编号" rules={[{ required: true, message: '请输入菜单编号' }]}>
                                <Input placeholder="请输入菜单编号" maxLength={50} showCount />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="type" label="菜单类型">
                                <Select placeholder="请选择" defaultValue="menu">
                                    <Select.Option value="menu">菜单</Select.Option>
                                    <Select.Option value="button">按钮</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="alias" label="菜单别名" rules={[{ required: true, message: '请输入菜单别名' }]}>
                                <Input placeholder="请输入菜单别名" maxLength={500} showCount />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="newWindow" label="新窗口">
                                <Select placeholder="请选择" defaultValue="no">
                                    <Select.Option value="no">否</Select.Option>
                                    <Select.Option value="yes">是</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="external" label="是否跳转第三方页面">
                                <Select placeholder="请选择" defaultValue="no">
                                    <Select.Option value="no">否</Select.Option>
                                    <Select.Option value="yes">是</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="enabled" label="是否启用" initialValue={true}>
                                <Radio.Group>
                                    <Radio value={true}>是</Radio>
                                    <Radio value={false}>否</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="sort" label="菜单排序" rules={[{ required: true, message: '请输入菜单排序' }]}>
                                <InputNumber placeholder="请输入菜单排序" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="listType" label="菜单列表">
                                <Select placeholder="请选择" defaultValue="default">
                                    <Select.Option value="default">默认类型</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={24}>
                            <Form.Item name="remark" label="菜单备注">
                                <Input.TextArea placeholder="请输入菜单备注" maxLength={500} showCount rows={3} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                        <Button type="primary" icon={<Save size={14} />}>保存</Button>
                        <Button type="primary" icon={<Save size={14} />}>保存并返回</Button>
                        <Button type="primary" icon={<Save size={14} />}>保存并新增</Button>
                        <Button onClick={() => setMenuModalOpen(false)}>取消</Button>
                    </div>
                </Form>
            </Modal>

            <Drawer
                open={dataPolicyDrawerOpen}
                title={dataPolicyEditing ? '编辑数据策略' : '新建数据策略'}
                width={720}
                onClose={() => setDataPolicyDrawerOpen(false)}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button onClick={() => setDataPolicyDrawerOpen(false)}>取消</Button>
                        <Button icon={<Play size={14} />} onClick={() => setDataPolicyTestOpen(true)}>测试</Button>
                        <Button type="primary" icon={<Save size={14} />} onClick={handleSaveDataPolicy}>保存</Button>
                    </div>
                }
            >
                <Form form={dataPolicyForm} layout="vertical" data-annotation-id="annotation-15">
                    <Divider plain>基本信息</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="name" label="策略名称" rules={[{ required: true }]}>
                                <Input placeholder="请输入策略名称" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="code" label="策略编码" rules={[{ required: true }]}>
                                <Input placeholder="如 data_scope_self_factory" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="entities" label="适用业务对象" rules={[{ required: true }]}>
                                <Select mode="multiple" placeholder="请选择" options={ENTITY_OPTIONS.map((e) => ({ label: e, value: e }))} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="type" label="策略类型" rules={[{ required: true }]}>
                                <Select placeholder="请选择" options={[
                                    { label: '组织与层级', value: 'org' },
                                    { label: '维度列表', value: 'dimension' },
                                    { label: '用户属性', value: 'userAttr' },
                                    { label: '自定义SQL条件', value: 'sql' },
                                ]} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="description" label="描述">
                                <Input.TextArea placeholder="解释该策略的作用" rows={2} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                                <Radio.Group>
                                    <Radio value="active">启用</Radio>
                                    <Radio value="inactive">停用</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider plain>策略规则配置</Divider>
                    <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
                        {({ getFieldValue }) => {
                            const type = getFieldValue('type') as PolicyType;
                            if (type === 'org') {
                                return (
                                    <div>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name={['ruleConfig', 'baseScope']} label="基础范围" rules={[{ required: true }]}>
                                                    <Select placeholder="请选择" options={[
                                                        { label: '本组织', value: 'self' },
                                                        { label: '本组织及下级', value: 'selfAndChildren' },
                                                        { label: '仅指定组织（参数化）', value: 'specified' },
                                                    ]} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name={['ruleConfig', 'orgTypes']} label="组织类型过滤">
                                                    <Select mode="multiple" placeholder="可选限制组织类型" options={ORG_TYPE_OPTIONS.map((o) => ({ label: o, value: o }))} />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.ruleConfig?.baseScope !== cur.ruleConfig?.baseScope}>
                                            {({ getFieldValue: gv }) => {
                                                const baseScope = gv(['ruleConfig', 'baseScope']);
                                                if (baseScope !== 'specified') return null;
                                                return (
                                                    <div style={{ marginBottom: 16, padding: '8px 12px', background: 'rgba(0,0,0,0.04)', borderRadius: 6, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                                                        参数化设计：该策略使用占位符 {'{{orgId}}'}，绑定角色时由角色实例化传入具体组织参数。
                                                    </div>
                                                );
                                            }}
                                        </Form.Item>
                                    </div>
                                );
                            }
                            if (type === 'dimension') {
                                return (
                                    <div>
                                        <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16 }}>
                                            <Form.List name={['ruleConfig', 'groups']} initialValue={[{ logic: 'AND', conditions: [{ matchMode: 'userAttr' }] }]}>
                                                {(groupFields, { add: addGroup, remove: removeGroup }) => (
                                                    <div>
                                                        {groupFields.map((group, gIdx) => (
                                                            <div key={group.key}>
                                                                {gIdx > 0 && (
                                                                    <Form.Item name={['ruleConfig', 'groupLogic']} initialValue="AND" style={{ marginBottom: 8, textAlign: 'center' }}>
                                                                        <Select style={{ width: 80 }} options={[
                                                                            { label: 'AND', value: 'AND' },
                                                                            { label: 'OR', value: 'OR' },
                                                                        ]} />
                                                                    </Form.Item>
                                                                )}
                                                                <div style={{ border: '1px solid #e8e8e8', borderRadius: 6, padding: 16, marginBottom: 8, background: '#fafafa' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                            <span style={{ fontWeight: 600, fontSize: 13 }}>条件组 {gIdx + 1}</span>
                                                                            <Form.Item name={[group.name, 'logic']} initialValue="AND" noStyle>
                                                                                <Select style={{ width: 72 }} size="small" options={[
                                                                                    { label: 'AND', value: 'AND' },
                                                                                    { label: 'OR', value: 'OR' },
                                                                                ]} />
                                                                            </Form.Item>
                                                                        </div>
                                                                        {groupFields.length > 1 && (
                                                                            <Button type="link" danger size="small" onClick={() => removeGroup(group.name)}>删除组</Button>
                                                                        )}
                                                                    </div>
                                                                    <Form.List name={[group.name, 'conditions']}>
                                                                        {(condFields, { add: addCond, remove: removeCond }) => (
                                                                            <div>
                                                                                {condFields.map((cond, cIdx) => (
                                                                                    <div key={cond.key} style={{ border: '1px dashed #d9d9d9', borderRadius: 4, padding: 12, marginBottom: 8, background: '#fff' }}>
                                                                                        <Form.Item noStyle shouldUpdate={(prev, cur) => {
                                                                                            const prevMode = prev.ruleConfig?.groups?.[group.name]?.conditions?.[cond.name]?.matchMode;
                                                                                            const curMode = cur.ruleConfig?.groups?.[group.name]?.conditions?.[cond.name]?.matchMode;
                                                                                            return prevMode !== curMode;
                                                                                        }}>
                                                                                            {({ getFieldValue }) => {
                                                                                                const mode = getFieldValue(['ruleConfig', 'groups', group.name, 'conditions', cond.name, 'matchMode']);
                                                                                                return (
                                                                                                    <div>
                                                                                                        {(mode === 'userAttr' || mode === 'list') ? (
                                                                                                            <Row gutter={16}>
                                                                                                                <Col span={12}>
                                                                                                                    <Form.Item name={[cond.name, 'matchMode']} label="匹配模式" rules={[{ required: true }]}>
                                                                                                                        <Select placeholder="请选择" options={[
                                                                                                                            { label: '用户属性中的维度值', value: 'userAttr' },
                                                                                                                            { label: '指定列表（参数化）', value: 'list' },
                                                                                                                            { label: '自定义表达式', value: 'custom' },
                                                                                                                        ]} />
                                                                                                                    </Form.Item>
                                                                                                                </Col>
                                                                                                                <Col span={12}>
                                                                                                                    <Form.Item name={[cond.name, 'field']} label="字段" rules={[{ required: true }]}>
                                                                                                                        <Select placeholder="选择字段" options={[
                                                                                                                            { label: '设备.产线工段', value: 'device.production_line' },
                                                                                                                            { label: '设备.工厂ID', value: 'device.factory_id' },
                                                                                                                            { label: '工单.创建人', value: 'workorder.creator_id' },
                                                                                                                        ]} />
                                                                                                                    </Form.Item>
                                                                                                                </Col>
                                                                                                            </Row>
                                                                                                        ) : (
                                                                                                            <Form.Item name={[cond.name, 'matchMode']} label="匹配模式" rules={[{ required: true }]}>
                                                                                                                <Select placeholder="请选择" options={[
                                                                                                                    { label: '用户属性中的维度值', value: 'userAttr' },
                                                                                                                    { label: '指定列表（参数化）', value: 'list' },
                                                                                                                    { label: '自定义表达式', value: 'custom' },
                                                                                                                ]} />
                                                                                                            </Form.Item>
                                                                                                        )}
                                                                                                        {mode === 'userAttr' && (
                                                                                                            <Row gutter={16}>
                                                                                                                <Col span={12}>
                                                                                                                    <Form.Item name={[cond.name, 'operator']} label="操作符" rules={[{ required: true }]}>
                                                                                                                        <Select placeholder="请选择" options={[
                                                                                                                            { label: '等于', value: 'eq' },
                                                                                                                            { label: '不等于', value: 'ne' },
                                                                                                                            { label: '在...中', value: 'in' },
                                                                                                                            { label: '不在...中', value: 'notIn' },
                                                                                                                        ]} />
                                                                                                                    </Form.Item>
                                                                                                                </Col>
                                                                                                                <Col span={12}>
                                                                                                                    <Form.Item name={[cond.name, 'userAttr']} label="用户属性" rules={[{ required: true }]}>
                                                                                                                        <Select placeholder="请选择" options={[
                                                                                                                            { label: '所属产线', value: 'accessibleProductionLines' },
                                                                                                                            { label: '所属组织', value: 'accessibleOrgs' },
                                                                                                                            { label: '所属工厂列表', value: 'accessibleFactories' },
                                                                                                                            { label: '岗位级别', value: 'positionLevel' },
                                                                                                                        ]} />
                                                                                                                    </Form.Item>
                                                                                                                </Col>
                                                                                                            </Row>
                                                                                                        )}
                                                                                                        {mode === 'list' && (
                                                                                                            <div>
                                                                                                                <Row gutter={16}>
                                                                                                                    <Col span={12}>
                                                                                                                        <Form.Item name={[cond.name, 'operator']} label="操作符" rules={[{ required: true }]}>
                                                                                                                            <Select placeholder="请选择" options={[
                                                                                                                                { label: '等于', value: 'eq' },
                                                                                                                                { label: '不等于', value: 'ne' },
                                                                                                                                { label: '在...中', value: 'in' },
                                                                                                                                { label: '不在...中', value: 'notIn' },
                                                                                                                            ]} />
                                                                                                                        </Form.Item>
                                                                                                                    </Col>
                                                                                                                    <Col span={12}>
                                                                                                                        <Form.Item name={[cond.name, 'valueSource']} label="值来源" rules={[{ required: true }]}>
                                                                                                                            <Radio.Group>
                                                                                                                                <Radio value="fixed">固定列表</Radio>
                                                                                                                                <Radio value="userAttr">从用户属性获取</Radio>
                                                                                                                            </Radio.Group>
                                                                                                                        </Form.Item>
                                                                                                                    </Col>
                                                                                                                </Row>
                                                                                                                <Form.Item noStyle shouldUpdate={(prev, cur) => {
                                                                                                                    const prevSrc = prev.ruleConfig?.groups?.[group.name]?.conditions?.[cond.name]?.valueSource;
                                                                                                                    const curSrc = cur.ruleConfig?.groups?.[group.name]?.conditions?.[cond.name]?.valueSource;
                                                                                                                    return prevSrc !== curSrc;
                                                                                                                }}>
                                                                                                                    {({ getFieldValue: gv }) => {
                                                                                                                        const src = gv(['ruleConfig', 'groups', group.name, 'conditions', cond.name, 'valueSource']);
                                                                                                                        if (src === 'fixed') {
                                                                                                                            return (
                                                                                                                                <Form.Item name={[cond.name, 'fixedValues']} label="固定列表值">
                                                                                                                                    <Select mode="tags" placeholder="输入值后回车，如 窑线、磨线" />
                                                                                                                                </Form.Item>
                                                                                                                            );
                                                                                                                        }
                                                                                                                        if (src === 'userAttr') {
                                                                                                                            return (
                                                                                                                                <Form.Item name={[cond.name, 'userAttrList']} label="用户属性" rules={[{ required: true }]}>
                                                                                                                                    <Select placeholder="选择用户多值属性" options={[
                                                                                                                                        { label: '可访问产线列表', value: 'accessibleProductionLines' },
                                                                                                                                        { label: '可访问组织列表', value: 'accessibleOrgs' },
                                                                                                                                        { label: '可访问工厂列表', value: 'accessibleFactories' },
                                                                                                                                        { label: '用户角色列表', value: 'roles' },
                                                                                                                                    ]} />
                                                                                                                                </Form.Item>
                                                                                                                            );
                                                                                                                        }
                                                                                                                        return null;
                                                                                                                    }}
                                                                                                                </Form.Item>
                                                                                                            </div>
                                                                                                        )}
                                                                                                        {mode === 'custom' && (
                                                                                                            <div>
                                                                                                                <Form.Item name={[cond.name, 'expression']} label="表达式" rules={[{ required: true }]}>
                                                                                                                    <Input.TextArea placeholder="输入SQL WHERE片段，可用宏变量 {user.orgId}, {user.userId}, {table}" rows={4} />
                                                                                                                </Form.Item>
                                                                                                                <Button icon={<Play size={14} />} onClick={() => message.success('语法校验通过')}>校验语法</Button>
                                                                                                            </div>
                                                                                                        )}
                                                                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                                                                                            <Button type="link" danger size="small" onClick={() => removeCond(cond.name)}>删除</Button>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            }}
                                                                                        </Form.Item>
                                                                                    </div>
                                                                                ))}
                                                                                <Button type="dashed" block size="small" icon={<Plus size={14} />} onClick={() => addCond({ matchMode: 'userAttr' })}>添加原子条件</Button>
                                                                            </div>
                                                                        )}
                                                                    </Form.List>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <Button type="dashed" block icon={<Plus size={14} />} onClick={() => addGroup({ logic: 'AND', conditions: [{ matchMode: 'userAttr' }] })}>添加条件组</Button>
                                                    </div>
                                                )}
                                            </Form.List>
                                        </div>
                                    </div>
                                );
                            }
                            if (type === 'userAttr') {
                                return (
                                    <div>
                                        <Row gutter={16}>
                                            <Col span={24}>
                                                <Form.Item name={['ruleConfig', 'userAttrRule']} rules={[{ required: true }]}>
                                                    <Radio.Group>
                                                        <Space direction="vertical">
                                                            <Radio value="selfOnly">仅本人创建的数据</Radio>
                                                            <Radio value="selfAndSubordinate">本人及下属创建的数据</Radio>
                                                            <Radio value="advanced">高级：选择用户属性字段与数据字段比较</Radio>
                                                        </Space>
                                                    </Radio.Group>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Form.Item noStyle shouldUpdate={(prev, cur) => {
                                            const prevRule = prev.ruleConfig?.userAttrRule;
                                            const curRule = cur.ruleConfig?.userAttrRule;
                                            return prevRule !== curRule;
                                        }}>
                                            {({ getFieldValue: gv }) => {
                                                const rule = gv(['ruleConfig', 'userAttrRule']);
                                                if (rule !== 'advanced') return null;
                                                return (
                                                    <div style={{ marginLeft: 24, marginTop: 8, padding: 16, background: 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
                                                        <Row gutter={16}>
                                                            <Col span={8}>
                                                                <Form.Item name={['ruleConfig', 'advancedUserAttr']} label="用户属性字段" rules={[{ required: true }]}>
                                                                    <Select placeholder="选择用户属性" options={[
                                                                        { label: '岗位', value: 'position' },
                                                                        { label: '部门', value: 'department' },
                                                                        { label: '组织', value: 'organization' },
                                                                        { label: '工号', value: 'employeeNo' },
                                                                        { label: '级别', value: 'level' },
                                                                        { label: '可访问产线', value: 'accessibleLines' },
                                                                        { label: '可访问组织', value: 'accessibleOrgs' },
                                                                        { label: '直属上级', value: 'supervisor' },
                                                                    ]} />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col span={8}>
                                                                <Form.Item name={['ruleConfig', 'advancedOperator']} label="比较操作符" rules={[{ required: true }]} initialValue="eq">
                                                                    <Select options={[
                                                                        { label: '等于（=）', value: 'eq' },
                                                                        { label: '不等于（≠）', value: 'neq' },
                                                                        { label: '包含', value: 'contains' },
                                                                        { label: '属于（IN）', value: 'in' },
                                                                        { label: '不属于（NOT IN）', value: 'notIn' },
                                                                        { label: '大于（>）', value: 'gt' },
                                                                        { label: '小于（<）', value: 'lt' },
                                                                    ]} />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col span={8}>
                                                                <Form.Item name={['ruleConfig', 'advancedDataField']} label="数据字段" rules={[{ required: true }]}>
                                                                    <Select placeholder="选择数据字段" options={[
                                                                        { label: '创建人', value: 'createdBy' },
                                                                        { label: '创建人岗位', value: 'createdByPosition' },
                                                                        { label: '创建人部门', value: 'createdByDept' },
                                                                        { label: '所属组织', value: 'orgId' },
                                                                        { label: '所属产线', value: 'productionLineId' },
                                                                        { label: '负责人', value: 'responsiblePerson' },
                                                                        { label: '负责人岗位', value: 'responsiblePosition' },
                                                                        { label: '负责人部门', value: 'responsibleDept' },
                                                                    ]} />
                                                                </Form.Item>
                                                            </Col>
                                                        </Row>
                                                        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
                                                            规则说明：当用户的「用户属性字段」与数据记录的「数据字段」满足「比较操作符」关系时，该数据可见。
                                                        </div>
                                                    </div>
                                                );
                                            }}
                                        </Form.Item>
                                    </div>
                                );
                            }
                            if (type === 'sql') {
                                return (
                                    <div>
                                        <Form.Item name={['ruleConfig', 'sqlSnippet']} label="SQL片段编辑器" rules={[{ required: true }]}>
                                            <Input.TextArea placeholder="输入 WHERE 条件片段，可用宏变量：{user.orgId}, {user.userId}, {role.roleId}" rows={6} />
                                        </Form.Item>
                                        <div style={{ marginBottom: 16 }}>
                                            <Button icon={<Play size={14} />} onClick={() => setDataPolicyTestOpen(true)}>预览</Button>
                                            <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>仅允许 SELECT 条件的 WHERE 部分，禁止 DDL/DML</span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    </Form.Item>

                </Form>
            </Drawer>

            <Modal open={dataPolicyTestOpen} title="测试数据策略" onCancel={() => setDataPolicyTestOpen(false)} onOk={handleTestPolicy} width={600}>
                <Form layout="vertical">
                    <Form.Item label="测试用户ID / 姓名">
                        <Input value={dataPolicyTestUser} onChange={(e) => setDataPolicyTestUser(e.target.value)} placeholder="例如：孙立军" />
                    </Form.Item>
                    {dataPolicyTestResult && (
                        <div className="admin-card" style={{ background: '#f5f5f5', whiteSpace: 'pre-line', fontSize: 13 }}>
                            {dataPolicyTestResult}
                        </div>
                    )}
                </Form>
            </Modal>

            <Modal open={dataPolicyRefOpen} title="策略引用关系" onCancel={() => setDataPolicyRefOpen(false)} footer={null}>
                {dataPolicyRefId && POLICY_REFERENCES[dataPolicyRefId] ? (
                    <Table
                        dataSource={POLICY_REFERENCES[dataPolicyRefId].map((ref, i) => ({ key: i, ...ref }))}
                        columns={[
                            { title: '角色', dataIndex: 'role' },
                            { title: '组织', dataIndex: 'org' },
                        ]}
                        pagination={false}
                        size="small"
                    />
                ) : (
                    <div style={{ padding: 24, textAlign: 'center', color: 'rgba(0,0,0,0.45)' }}>暂无角色引用该策略</div>
                )}
            </Modal>

            <Modal
                open={dataPolicyLogOpen}
                title={dataPolicyLogId ? `「${dataPolicies.find((p) => p.id === dataPolicyLogId)?.name}」操作日志` : '操作日志'}
                onCancel={() => setDataPolicyLogOpen(false)}
                footer={null}
                width={700}
            >
                <Timeline
                    items={[
                        { children: <div><b>2024-06-01 14:32:00</b> 管理员 新建策略</div> },
                        { children: <div><b>2024-05-28 09:15:00</b> 管理员 修改状态为"启用"</div> },
                        { children: <div><b>2024-05-20 11:00:00</b> 管理员 复制策略</div> },
                        { children: <div><b>2024-04-15 16:45:00</b> 管理员 删除策略（已被引用，删除失败）</div> },
                    ]}
                />
            </Modal>

            {/* ===== 字段权限抽屉 ===== */}
            <Drawer
                open={fieldDrawerOpen}
                title={fieldEditing ? '编辑字段权限规则' : '新建字段权限规则'}
                width={900}
                onClose={() => setFieldDrawerOpen(false)}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button onClick={() => setFieldDrawerOpen(false)}>取消</Button>
                        <Button icon={<Eye size={14} />} onClick={() => {
                            previewForm.resetFields();
                            setPreviewResult(null);
                            setPreviewModalOpen(true);
                        }}>预览</Button>
                        <Button type="primary" icon={<Save size={14} />} onClick={handleSaveFieldRule}>保存</Button>
                        <Button type="primary" icon={<Save size={14} />} onClick={() => {
                            handleSaveFieldRule();
                            setTimeout(() => openFieldDrawer(), 300);
                        }}>保存并继续新增</Button>
                    </div>
                }
            >
                <Form form={fieldForm} layout="vertical">
                    <Divider plain>基本信息</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
                                <Input placeholder="请输入规则名称" maxLength={100} showCount />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="code" label="规则编码" rules={[{ required: true, message: '请输入规则编码' }]}>
                                <Input placeholder="如 field_perm_device" maxLength={100} showCount />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="entity" label="适用业务对象" rules={[{ required: true, message: '请选择业务对象' }]}>
                                <Select
                                    placeholder="请选择业务对象"
                                    options={Object.keys(ENTITY_META).map((e) => ({ label: e, value: e }))}
                                    onChange={(v) => {
                                        setFieldConfigEntity(v);
                                        if (fieldConfigs.length === 0) {
                                            syncFieldsFromEntity(v);
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="status" label="状态" rules={[{ required: true }]} initialValue="inactive">
                                <Radio.Group>
                                    <Radio value="active">启用</Radio>
                                    <Radio value="inactive">停用</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="description" label="描述">
                                <Input.TextArea placeholder="请输入规则描述" maxLength={500} showCount rows={2} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>

                <Divider plain>字段权限配置</Divider>
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button icon={<RefreshCw size={14} />} onClick={() => {
                        const entity = fieldForm.getFieldValue('entity');
                        if (entity) syncFieldsFromEntity(entity);
                        else message.warning('请先选择适用业务对象');
                    }}>从业务对象同步字段</Button>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>当前业务对象：{fieldConfigEntity || '未选择'}</span>
                </div>
                <Table
                    rowKey="fieldName"
                    size="small"
                    pagination={false}
                    dataSource={fieldConfigs}
                    columns={[
                        { title: '字段名称', dataIndex: 'fieldLabel', render: (v: string, rc: FieldConfig) => <div><div style={{ fontWeight: 500 }}>{v}</div><div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{rc.fieldName}</div></div> },
                        { title: '字段类型', dataIndex: 'fieldType', width: 90 },
                        {
                            title: '默认权限',
                            dataIndex: 'defaultPermission',
                            width: 120,
                            render: (v: FieldPermissionType, rc: FieldConfig, idx: number) => (
                                <Select
                                    size="small"
                                    value={v}
                                    style={{ width: 100 }}
                                    onChange={(val) => {
                                        const next = [...fieldConfigs];
                                        next[idx] = { ...next[idx], defaultPermission: val };
                                        setFieldConfigs(next);
                                    }}
                                    options={[
                                        { value: 'hidden', label: '隐藏' },
                                        { value: 'readonly', label: '只读' },
                                        { value: 'editable', label: '可编辑' },
                                    ]}
                                />
                            ),
                        },
                        {
                            title: '条件权限',
                            dataIndex: 'conditions',
                            width: 280,
                            render: (conds: ConditionPermission[], rc: FieldConfig) => (
                                <div>
                                    {conds.length === 0 && <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.25)' }}>-</span>}
                                    {conds.map((c) => (
                                        <div key={c.id} style={{ fontSize: 12, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Tag color="blue" style={{ fontSize: 12 }}>{c.priority}</Tag>
                                            <span style={{ color: 'rgba(0,0,0,0.65)', flex: 1 }}>{CONDITION_TYPE_LABEL[c.conditionType]} → {PERMISSION_LABEL[c.permission]}</span>
                                            <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }} onClick={() => {
                                                setConditionEditingField(rc.fieldName);
                                                setConditionEditingId(c.id);
                                                conditionForm.setFieldsValue({
                                                    name: c.name,
                                                    conditionType: c.conditionType,
                                                    permission: c.permission,
                                                    priority: c.priority,
                                                    config: c.config,
                                                });
                                                setConditionModalOpen(true);
                                            }}>编辑</Button>
                                            <Button type="link" size="small" danger style={{ padding: 0, fontSize: 12 }} onClick={() => {
                                                setFieldConfigs((prev) => prev.map((fc) => {
                                                    if (fc.fieldName !== rc.fieldName) return fc;
                                                    return { ...fc, conditions: fc.conditions.filter((cc) => cc.id !== c.id) };
                                                }));
                                                message.success('条件已删除');
                                            }}>删除</Button>
                                        </div>
                                    ))}
                                    <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }} onClick={() => {
                                        setConditionEditingField(rc.fieldName);
                                        setConditionEditingId(null);
                                        conditionForm.resetFields();
                                        setConditionModalOpen(true);
                                    }}>添加条件</Button>
                                </div>
                            ),
                        },
                        {
                            title: '脱敏规则',
                            dataIndex: 'maskingRule',
                            width: 140,
                            render: (v: MaskingType, rc: FieldConfig, idx: number) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Select
                                        size="small"
                                        value={v}
                                        style={{ width: 100 }}
                                        onChange={(val) => {
                                            const next = [...fieldConfigs];
                                            next[idx] = { ...next[idx], maskingRule: val };
                                            setFieldConfigs(next);
                                        }}
                                        options={[
                                            { value: 'none', label: '无' },
                                            { value: 'phone', label: '手机号脱敏' },
                                            { value: 'idCard', label: '身份证脱敏' },
                                            { value: 'custom', label: '自定义正则' },
                                        ]}
                                    />
                                    {v === 'custom' && (
                                        <Button type="link" size="small" icon={<Settings size={12} />} onClick={() => {
                                            setMaskingEditingField(rc.fieldName);
                                            maskingForm.setFieldsValue({ customRegex: rc.maskingCustom || '' });
                                            setMaskingModalOpen(true);
                                        }} />
                                    )}
                                </div>
                            ),
                        },
                        {
                            title: '操作',
                            key: 'action',
                            width: 80,
                            render: (_, rc: FieldConfig, idx: number) => (
                                <Space size="small">
                                    <Button type="link" size="small" danger onClick={() => {
                                        const next = fieldConfigs.filter((_, i) => i !== idx);
                                        setFieldConfigs(next);
                                    }}>删除</Button>
                                </Space>
                            ),
                        },
                    ]}
                />
            </Drawer>

            {/* 引用角色 */}
            <Modal open={fieldRefOpen} title="引用角色" onCancel={() => setFieldRefOpen(false)} footer={null}>
                {fieldRefId && FIELD_RULE_REFERENCES[fieldRefId] ? (
                    <Table
                        dataSource={FIELD_RULE_REFERENCES[fieldRefId].map((ref, i) => ({ key: i, ...ref }))}
                        columns={[
                            { title: '角色', dataIndex: 'role' },
                            { title: '覆盖配置数', dataIndex: 'overrideCount', render: (v: number) => <Tag color={v > 0 ? 'warning' : 'default'}>{v} 条</Tag> },
                        ]}
                        pagination={false}
                        size="small"
                    />
                ) : (
                    <div style={{ padding: 24, textAlign: 'center', color: 'rgba(0,0,0,0.45)' }}>暂无角色引用该规则</div>
                )}
            </Modal>

            {/* 条件权限配置 */}
            <Modal
                open={conditionModalOpen}
                title={conditionEditingId ? '编辑条件权限' : '添加条件权限'}
                onCancel={() => setConditionModalOpen(false)}
                onOk={() => {
                    conditionForm.validateFields().then((values) => {
                        if (conditionEditingId) {
                            setFieldConfigs((prev) => prev.map((fc) => {
                                if (fc.fieldName !== conditionEditingField) return fc;
                                return {
                                    ...fc,
                                    conditions: fc.conditions.map((cc) =>
                                        cc.id === conditionEditingId
                                            ? { ...cc, name: values.name, conditionType: values.conditionType, config: values.config, permission: values.permission, priority: values.priority || 1 }
                                            : cc
                                    ),
                                };
                            }));
                            setConditionModalOpen(false);
                            message.success('条件已更新');
                        } else {
                            const newCond: ConditionPermission = {
                                id: `c-${Date.now()}`,
                                name: values.name,
                                conditionType: values.conditionType,
                                config: values.config,
                                permission: values.permission,
                                priority: values.priority || 1,
                            };
                            setFieldConfigs((prev) => prev.map((fc) => {
                                if (fc.fieldName !== conditionEditingField) return fc;
                                return { ...fc, conditions: [...fc.conditions, newCond] };
                            }));
                            setConditionModalOpen(false);
                            message.success('条件已添加');
                        }
                    });
                }}
                width={600}
            >
                <Form form={conditionForm} layout="vertical">
                    <Form.Item name="name" label="条件名称">
                        <Input placeholder="可选，用于标识该条件" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="conditionType" label="条件类型" rules={[{ required: true }]} initialValue="role">
                                <Select options={[
                                    { value: 'userAttr', label: '用户属性匹配' },
                                    { value: 'role', label: '角色匹配' },
                                    { value: 'custom', label: '自定义表达式' },
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="permission" label="满足时权限" rules={[{ required: true }]} initialValue="readonly">
                                <Select options={[
                                    { value: 'hidden', label: '隐藏' },
                                    { value: 'readonly', label: '只读' },
                                    { value: 'editable', label: '可编辑' },
                                ]} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="priority" label="优先级" initialValue={1}>
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="数字越小越优先" />
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate={(prev, cur) => prev.conditionType !== cur.conditionType}>
                        {({ getFieldValue }) => {
                            const type = getFieldValue('conditionType') as ConditionType;
                            if (type === 'role') {
                                return (
                                    <Form.Item name={['config', 'roles']} label="匹配角色" rules={[{ required: true }]}>
                                        <Select mode="multiple" placeholder="选择角色" options={[
                                            '工厂管理员', '生产审批', '车间安全员', '窑系统监控', '生产报表审核', '车间安全管理',
                                            '运输调度查看', '矿山管理', '区域管理员', '集团报表', '销售经理', '财务经理', '客服',
                                        ].map((r) => ({ label: r, value: r }))} />
                                    </Form.Item>
                                );
                            }
                            if (type === 'userAttr') {
                                return (
                                    <Row gutter={16}>
                                        <Col span={8}>
                                            <Form.Item name={['config', 'attr']} label="用户属性" rules={[{ required: true }]}>
                                                <Select placeholder="选择属性" options={[
                                                    { label: '岗位', value: '岗位' },
                                                    { label: '部门', value: '部门' },
                                                    { label: '组织', value: '组织' },
                                                ]} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item name={['config', 'operator']} label="操作符" rules={[{ required: true }]} initialValue="eq">
                                                <Select options={[
                                                    { label: '等于', value: 'eq' },
                                                    { label: '包含', value: 'contains' },
                                                    { label: '属于', value: 'in' },
                                                ]} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item name={['config', 'value']} label="匹配值" rules={[{ required: true }]}>
                                                <Input placeholder="如 总监" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                );
                            }
                            if (type === 'custom') {
                                return (
                                    <Form.Item name={['config', 'expression']} label="自定义表达式" rules={[{ required: true }]}>
                                        <Input.TextArea placeholder="输入条件表达式，如 {user.dept} = '烧成车间'" rows={3} />
                                    </Form.Item>
                                );
                            }
                            return null;
                        }}
                    </Form.Item>
                </Form>
            </Modal>

            {/* 脱敏规则配置 */}
            <Modal
                open={maskingModalOpen}
                title="自定义脱敏规则"
                onCancel={() => setMaskingModalOpen(false)}
                onOk={() => {
                    maskingForm.validateFields().then((values) => {
                        setFieldConfigs((prev) => prev.map((fc) => {
                            if (fc.fieldName !== maskingEditingField) return fc;
                            return { ...fc, maskingCustom: values.customRegex };
                        }));
                        setMaskingModalOpen(false);
                    });
                }}
            >
                <Form form={maskingForm} layout="vertical">
                    <Form.Item name="customRegex" label="正则表达式" rules={[{ required: true }]}>
                        <Input placeholder="如 (^\d{3}).*(\d{4}$)" />
                    </Form.Item>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                        示例：手机号脱敏可用正则 <code>(^\d{3}).*(\d{4}$)</code>，替换为 <code>$1****$2</code>
                    </div>
                </Form>
            </Modal>

            {/* 预览 */}
            <Modal
                open={previewModalOpen}
                title="规则预览"
                onCancel={() => setPreviewModalOpen(false)}
                footer={null}
                width={700}
            >
                <Form form={previewForm} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="mockUser" label="模拟用户">
                                <Input placeholder="输入用户姓名" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="mockPosition" label="模拟岗位">
                                <Input placeholder="如 总监" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="mockRoles" label="模拟角色">
                        <Select mode="multiple" placeholder="选择角色" options={[
                            '工厂管理员', '生产审批', '车间安全员', '窑系统监控', '生产报表审核', '车间安全管理',
                            '运输调度查看', '矿山管理', '区域管理员', '集团报表', '销售经理', '财务经理', '客服',
                        ].map((r) => ({ label: r, value: r }))} />
                    </Form.Item>
                    <Button type="primary" icon={<Play size={14} />} onClick={handlePreview}>运行预览</Button>
                </Form>
                {previewResult && (
                    <div style={{ marginTop: 16 }}>
                        <Table
                            size="small"
                            pagination={false}
                            dataSource={previewResult}
                            columns={[
                                { title: '字段', dataIndex: 'label' },
                                { title: '技术名', dataIndex: 'fieldName' },
                                {
                                    title: '最终权限',
                                    dataIndex: 'finalPermission',
                                    render: (v: FieldPermissionType) => (
                                        <Tag color={PERMISSION_COLOR[v]}>{PERMISSION_LABEL[v]}</Tag>
                                    ),
                                },
                                { title: '脱敏', dataIndex: 'masking' },
                            ]}
                        />
                    </div>
                )}
            </Modal>

            {/* 字段权限操作日志 */}
            <Modal
                open={fieldLogOpen}
                title={fieldLogId ? `「${fieldRules.find((r) => r.id === fieldLogId)?.name}」操作日志` : '操作日志'}
                onCancel={() => setFieldLogOpen(false)}
                footer={null}
                width={700}
            >
                <Timeline
                    items={[
                        { children: <div><b>2024-06-10 10:30:00</b> 管理员 新建字段权限规则</div> },
                        { children: <div><b>2024-06-09 16:45:00</b> 管理员 修改字段权限配置（新增 2 条条件权限）</div> },
                        { children: <div><b>2024-06-08 14:20:00</b> 管理员 启用规则</div> },
                        { children: <div><b>2024-05-20 09:15:00</b> 管理员 停用规则</div> },
                    ]}
                />
            </Modal>
        </div>
    );
}
