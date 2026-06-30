import React, { useState } from 'react';
import { Plus, Play } from 'lucide-react';
import {
    Table, Button, Input, Select, Modal, Tag, Space, Row, Col, message, Drawer,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import RuleDrawer, {
    type BizRuleForm,
    type ScheduleConfig,
    BIZ_OBJECTS,
    TIMING_LABELS,
    SCHEDULE_UNIT_LABELS,
    formatScheduleDisplay,
    generateCode,
    defaultForm,
} from '../components/RuleDrawer';

type RuleStatus = 'active' | 'inactive';

interface ConditionItem {
    id: string;
    field: string;
    operator: string;
    valueType: string;
    value: any;
}

interface ConditionGroup {
    id: string;
    logic: 'AND' | 'OR';
    conditions: ConditionItem[];
}

interface ActionItem {
    id: string;
    type: string;
    params: Record<string, any>;
    condition?: ConditionGroup;
}

interface BizRule {
    id: string;
    name: string;
    code: string;
    bizObject: string;
    timing: string[];
    priority: number;
    breakAfter: boolean;
    status: RuleStatus;
    scopeType: 'all' | 'org' | 'line';
    scopeOrgs: string[];
    scopeLines: string[];
    description: string;
    hasCondition: boolean;
    conditionGroups: ConditionGroup[];
    conditionGroupsLogic: 'AND' | 'OR';
    actions: ActionItem[];
    advanced: {
        async: boolean;
        maxRetry: number;
        timeout: number;
        ignoreError: boolean;
    };
    schedule?: ScheduleConfig;
    version: number;
    updatedAt: string;
}

const BIZ_OBJECT_LABELS: Record<string, string> = {
    maintenance: '维修工单',
    quality: '质量检验单',
    todo: '待办事项',
    production: '生产批次',
    inventory: '库存记录',
};

const ACTION_TYPE_LABELS: Record<string, string> = {
    set_field: '设置字段值',
    send_notification: '发送通知',
    start_approval: '启动审批流',
    call_api: '调用API',
    create_task: '生成任务',
    update_related: '更新关联数据',
};

const SCOPE_LABELS: Record<string, string> = {
    all: '全部',
    org: '指定组织',
    line: '指定产线',
};

const initialRules: BizRule[] = [
    {
        id: 'br1',
        name: '熟料热耗超标预警',
        code: 'RULE-THERMAL-001',
        bizObject: 'production',
        timing: ['create_after', 'edit_after'],
        priority: 10,
        breakAfter: false,
        status: 'active',
        scopeType: 'org',
        scopeOrgs: ['DCC水泥厂'],
        scopeLines: [],
        description: '根据煤耗与熟料产量计算熟料单位热耗，超标时自动预警',
        hasCondition: true,
        conditionGroups: [
            {
                id: '_cg1',
                logic: 'AND',
                conditions: [
                    { id: '_c1', field: 'product', operator: 'eq', valueType: 'fixed', value: '熟料' },
                    { id: '_c2', field: 'quantity', operator: 'gt', valueType: 'fixed', value: '800' },
                ],
            },
        ],
        conditionGroupsLogic: 'AND',
        actions: [
            { id: '_a1', type: 'send_notification', params: { channel: 'site', title: '热耗超标预警', content: '熟料热耗超过标准值，请关注', receivers: ['manager'] } },
        ],
        advanced: { async: false, maxRetry: 3, timeout: 30, ignoreError: false },
        version: 3,
        updatedAt: '2024-05-20',
    },
    {
        id: 'br2',
        name: '出厂水泥强度锁定',
        code: 'RULE-QUALITY-001',
        bizObject: 'quality',
        timing: ['edit_before'],
        priority: 100,
        breakAfter: true,
        status: 'active',
        scopeType: 'org',
        scopeOrgs: ['DCC水泥厂'],
        scopeLines: [],
        description: '出厂水泥三天强度必须不低于25MPa，否则锁定出厂',
        hasCondition: true,
        conditionGroups: [
            {
                id: '_cg1',
                logic: 'AND',
                conditions: [
                    { id: '_c1', field: 'item', operator: 'eq', valueType: 'fixed', value: '三天强度' },
                    { id: '_c2', field: 'value', operator: 'lt', valueType: 'fixed', value: '25' },
                ],
            },
        ],
        conditionGroupsLogic: 'AND',
        actions: [
            { id: '_a1', type: 'set_field', params: { field: 'status', value: '不合格' } },
            { id: '_a2', type: 'send_notification', params: { channel: 'dingtalk', title: '质量异常', content: '出厂水泥强度不合格，已锁定', receivers: ['role_admin', 'manager'] } },
        ],
        advanced: { async: false, maxRetry: 3, timeout: 30, ignoreError: false },
        version: 2,
        updatedAt: '2024-04-15',
    },
    {
        id: 'br3',
        name: '熟料库位低自动补库',
        code: 'RULE-INVENTORY-001',
        bizObject: 'inventory',
        timing: ['scheduled', 'status_changed'],
        priority: 50,
        breakAfter: false,
        status: 'active',
        scopeType: 'org',
        scopeOrgs: ['DCC水泥厂'],
        scopeLines: [],
        description: '熟料库位低于30%时自动生成补库工单',
        hasCondition: true,
        conditionGroups: [
            {
                id: '_cg1',
                logic: 'AND',
                conditions: [
                    { id: '_c1', field: 'material', operator: 'eq', valueType: 'fixed', value: '熟料' },
                    { id: '_c2', field: 'ratio', operator: 'lt', valueType: 'fixed', value: '30' },
                ],
            },
        ],
        conditionGroupsLogic: 'AND',
        actions: [
            { id: '_a1', type: 'create_task', params: { taskType: 'restock', title: '熟料补库任务', assignee: 'role_production' } },
            { id: '_a2', type: 'send_notification', params: { channel: 'site', title: '补库提醒', content: '熟料库位不足，已生成补库任务', receivers: ['assignee'] } },
        ],
        advanced: { async: true, maxRetry: 3, timeout: 60, ignoreError: true },
        schedule: { interval: 1, unit: 'hour', hour: 0, minute: 0 },
        version: 1,
        updatedAt: '2024-06-01',
    },
    {
        id: 'br4',
        name: '重大质量事故跳级审批',
        code: 'RULE-APPROVAL-001',
        bizObject: 'quality',
        timing: ['create_after'],
        priority: 200,
        breakAfter: true,
        status: 'active',
        scopeType: 'org',
        scopeOrgs: ['伊拉克区域'],
        scopeLines: [],
        description: '重大质量事故跳过车间主任，直报区域经理审批',
        hasCondition: true,
        conditionGroups: [
            {
                id: '_cg1',
                logic: 'AND',
                conditions: [
                    { id: '_c1', field: 'result', operator: 'eq', valueType: 'fixed', value: '重大' },
                ],
            },
        ],
        conditionGroupsLogic: 'AND',
        actions: [
            { id: '_a1', type: 'start_approval', params: { flowId: 'flow_2', initiator: 'creator' } },
        ],
        advanced: { async: false, maxRetry: 3, timeout: 30, ignoreError: false },
        version: 1,
        updatedAt: '2024-03-10',
    },
    {
        id: 'br5',
        name: '窑头负压异常报警',
        code: 'RULE-MAINTENANCE-001',
        bizObject: 'maintenance',
        timing: ['create_after', 'scheduled'],
        priority: 80,
        breakAfter: false,
        status: 'active',
        scopeType: 'line',
        scopeOrgs: [],
        scopeLines: ['一线'],
        description: '窑头负压超出正常范围时自动报警并创建设备巡检任务',
        hasCondition: true,
        conditionGroups: [
            {
                id: '_cg1',
                logic: 'OR',
                conditions: [
                    { id: '_c1', field: 'device.name', operator: 'eq', valueType: 'fixed', value: '窑头负压传感器' },
                    { id: '_c2', field: 'priority', operator: 'eq', valueType: 'fixed', value: '紧急' },
                ],
            },
        ],
        conditionGroupsLogic: 'AND',
        actions: [
            { id: '_a1', type: 'send_notification', params: { channel: 'wecom', title: '窑头负压异常', content: '窑头负压超出安全范围，请立即检查', receivers: ['manager', 'role_admin'] } },
            { id: '_a2', type: 'create_task', params: { taskType: 'inspection', title: '窑头设备巡检', assignee: 'current_user' } },
        ],
        advanced: { async: false, maxRetry: 3, timeout: 30, ignoreError: false },
        schedule: { interval: 1, unit: 'day', hour: 9, minute: 0 },
        version: 4,
        updatedAt: '2024-05-28',
    },
    {
        id: 'br6',
        name: '煤耗波动提醒',
        code: 'RULE-PRODUCTION-002',
        bizObject: 'production',
        timing: ['edit_after'],
        priority: 40,
        breakAfter: false,
        status: 'inactive',
        scopeType: 'org',
        scopeOrgs: ['DCC水泥厂'],
        scopeLines: [],
        description: '煤耗较上日波动超过5%时发出提醒',
        hasCondition: false,
        conditionGroups: [],
        conditionGroupsLogic: 'AND',
        actions: [
            { id: '_a1', type: 'send_notification', params: { channel: 'email', title: '煤耗波动提醒', content: '今日煤耗较昨日波动超过5%', receivers: ['manager'] } },
        ],
        advanced: { async: true, maxRetry: 3, timeout: 60, ignoreError: true },
        version: 1,
        updatedAt: '2024-02-20',
    },
    {
        id: 'br7',
        name: '混合材掺量超限阻止',
        code: 'RULE-QUALITY-002',
        bizObject: 'quality',
        timing: ['edit_before', 'create_before'],
        priority: 90,
        breakAfter: true,
        status: 'active',
        scopeType: 'org',
        scopeOrgs: ['DCC水泥厂'],
        scopeLines: [],
        description: '混合材掺量超过配方上限时阻止并通知质量部',
        hasCondition: true,
        conditionGroups: [
            {
                id: '_cg1',
                logic: 'AND',
                conditions: [
                    { id: '_c1', field: 'item', operator: 'eq', valueType: 'fixed', value: '混合材掺量' },
                    { id: '_c2', field: 'value', operator: 'gt', valueType: 'fixed', value: '配方上限' },
                ],
            },
        ],
        conditionGroupsLogic: 'AND',
        actions: [
            { id: '_a1', type: 'set_field', params: { field: 'status', value: '阻止' } },
            { id: '_a2', type: 'send_notification', params: { channel: 'dingtalk', title: '掺量超限', content: '混合材掺量超过配方上限，已阻止操作', receivers: ['role_admin'] } },
        ],
        advanced: { async: false, maxRetry: 3, timeout: 30, ignoreError: false },
        version: 2,
        updatedAt: '2024-05-15',
    },
];

export default function RulePage() {
    const [rules, setRules] = useState<BizRule[]>(initialRules);
    const [search, setSearch] = useState('');
    const [bizObjectFilter, setBizObjectFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add');
    const [editingRule, setEditingRule] = useState<Partial<BizRuleForm>>();
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailId, setDetailId] = useState<string | null>(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [simulateOpen, setSimulateOpen] = useState(false);
    const [simulateLog, setSimulateLog] = useState<string | null>(null);

    const filtered = rules.filter((r) => {
        const text = `${r.name}${r.description}${r.code}`.toLowerCase();
        return text.includes(search.toLowerCase())
            && (bizObjectFilter === 'all' || r.bizObject === bizObjectFilter)
            && (statusFilter === 'all' || r.status === statusFilter);
    });

    const selected = rules.find((r) => r.id === detailId) || null;

    const openAdd = () => {
        setDrawerMode('add');
        setEditingRule(undefined);
        setDrawerOpen(true);
    };

    const openEdit = (id: string) => {
        const r = rules.find((x) => x.id === id);
        if (!r) return;
        setDrawerMode('edit');
        setEditingRule(r);
        setDrawerOpen(true);
    };

    const handleSave = (form: BizRuleForm) => {
        if (drawerMode === 'add') {
            const newRule: BizRule = {
                ...(form as BizRule),
                id: `br${Date.now()}`,
                version: 1,
                updatedAt: new Date().toISOString().slice(0, 10),
            };
            setRules([...rules, newRule]);
            message.success('新增规则成功');
        } else if (form.id) {
            setRules(rules.map((r) => (r.id === form.id ? { ...r, ...form, version: (r.version || 1) + 1, updatedAt: new Date().toISOString().slice(0, 10) } as BizRule : r)));
            message.success('编辑规则成功');
        }
        setDrawerOpen(false);
    };

    const toggleStatus = (id: string) => {
        const r = rules.find((x) => x.id === id);
        if (!r) return;
        const isActive = r.status === 'active';
        Modal.confirm({
            title: isActive ? '确认停用该规则？' : '确认启用该规则？',
            content: isActive ? '停用后该规则将不再生效。' : '启用后该规则将立即生效。',
            onOk: () => {
                setRules(rules.map((item) => {
                    if (item.id !== id) return item;
                    const next: RuleStatus = item.status === 'active' ? 'inactive' : 'active';
                    return { ...item, status: next } as BizRule;
                }));
            },
        });
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: '确认删除该规则？',
            content: '删除后不可恢复，是否继续？',
            onOk: () => {
                setRules(rules.filter((r) => r.id !== id));
                message.success('删除成功');
            },
        });
    };

    const runSimulate = () => {
        setSimulateLog(
            `[${new Date().toLocaleTimeString()}] 开始模拟运行...\n` +
            `[${new Date().toLocaleTimeString()}] 加载规则引擎：共 ${rules.filter((r) => r.status === 'active').length} 条活跃规则\n` +
            `[${new Date().toLocaleTimeString()}] 事件：生产批次创建 - 产品=熟料, 产量=850t\n` +
            `[${new Date().toLocaleTimeString()}] 匹配规则 #br1「熟料热耗超标预警」\n` +
            `[${new Date().toLocaleTimeString()}] 条件满足：产品=熟料 AND 产量>800\n` +
            `[${new Date().toLocaleTimeString()}] 执行动作：发送站内信通知给上级主管\n` +
            `[${new Date().toLocaleTimeString()}] breakAfter=false，继续匹配后续规则\n` +
            `[${new Date().toLocaleTimeString()}] 事件：库存状态变更 - 物料=熟料, 库位比例=25%\n` +
            `[${new Date().toLocaleTimeString()}] 匹配规则 #br3「熟料库位低自动补库」\n` +
            `[${new Date().toLocaleTimeString()}] 条件满足：物料=熟料 AND 库位比例<30%\n` +
            `[${new Date().toLocaleTimeString()}] 执行动作：生成补库任务（异步）\n` +
            `[${new Date().toLocaleTimeString()}] 执行动作：发送站内信通知给负责人\n` +
            `[${new Date().toLocaleTimeString()}] 模拟运行结束，共触发 2 条规则`
        );
    };

    const statusMeta: Record<RuleStatus, { label: string; color: string }> = {
        active: { label: '已启用', color: 'success' },
        inactive: { label: '已停用', color: 'error' },
    };

    const columns: ColumnsType<BizRule> = [
        {
            title: '规则名称',
            render: (_, r) => (
                <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{r.description}</div>
                </div>
            ),
        },
        {
            title: '规则编码',
            dataIndex: 'code',
            width: 160,
            render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
        },
        {
            title: '业务对象',
            dataIndex: 'bizObject',
            width: 110,
            render: (v: string) => <Tag style={{ fontSize: 11 }}>{BIZ_OBJECT_LABELS[v] || v}</Tag>,
        },
        {
            title: '应用时机',
            dataIndex: 'timing',
            width: 220,
            render: (v: string[]) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {v.slice(0, 3).map((t) => (
                        <Tag key={t} style={{ fontSize: 10, margin: 0 }}>{TIMING_LABELS[t] || t}</Tag>
                    ))}
                    {v.length > 3 && <Tag style={{ fontSize: 10, margin: 0 }}>+{v.length - 3}</Tag>}
                </div>
            ),
        },
        {
            title: '优先级',
            dataIndex: 'priority',
            width: 80,
        },
        {
            title: '生效范围',
            width: 140,
            render: (_, r) => {
                if (r.scopeType === 'all') return <span>全部</span>;
                const items = r.scopeType === 'org' ? r.scopeOrgs : r.scopeLines;
                return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {items.slice(0, 2).map((item) => (
                            <Tag key={item} style={{ fontSize: 10, margin: 0 }}>{item}</Tag>
                        ))}
                        {items.length > 2 && <Tag style={{ fontSize: 10, margin: 0 }}>+{items.length - 2}</Tag>}
                    </div>
                );
            },
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 90,
            render: (v: RuleStatus) => (
                <Tag color={statusMeta[v].color} style={{ fontSize: 11 }}>
                    {statusMeta[v].label}
                </Tag>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 220,
            render: (_, r) => (
                <Space size="small">
                    <Button type="link" size="small" disabled={r.status === 'active'} onClick={(e) => { e.stopPropagation(); openEdit(r.id); }}>编辑</Button>
                    <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); toggleStatus(r.id); }}>
                        {r.status === 'active' ? '停用' : '启用'}
                    </Button>
                    <Button type="link" size="small" disabled={r.status === 'active'} onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}>删除</Button>
                    <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); setHistoryOpen(true); }}>历史</Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Button type="primary" icon={<Plus size={14} />} onClick={openAdd}>新增规则</Button>
                <Button icon={<Play size={14} />} onClick={() => setSimulateOpen(true)}>模拟运行</Button>
                <div style={{ flex: 1 }} />
                <Select
                    value={bizObjectFilter}
                    style={{ width: 140 }}
                    onChange={(v) => setBizObjectFilter(v)}
                    options={[
                        { value: 'all', label: '全部对象' },
                        ...BIZ_OBJECTS.map((b) => ({ value: b.value, label: b.label })),
                    ]}
                />
                <Select
                    value={statusFilter}
                    style={{ width: 120 }}
                    onChange={(v) => setStatusFilter(v)}
                    options={[
                        { value: 'all', label: '全部状态' },
                        { value: 'active', label: '已启用' },
                        { value: 'inactive', label: '已停用' },
                    ]}
                />
                <Input.Search
                    placeholder="搜索规则..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: 200 }}
                    allowClear
                />
            </div>

            <div className="admin-card" style={{ padding: 0 }}>
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={filtered}
                    pagination={false}
                    onRow={(r) => ({
                        onClick: () => { setDetailId(r.id); setDetailOpen(true); },
                        style: { cursor: 'pointer' },
                    })}
                />
                {filtered.length === 0 && <div className="admin-empty">未找到匹配的规则</div>}
            </div>

            {/* 抽屉表单 */}
            <RuleDrawer
                open={drawerOpen}
                mode={drawerMode}
                initialData={editingRule}
                onClose={() => setDrawerOpen(false)}
                onSave={handleSave}
            />

            {/* 详情抽屉 */}
            <Drawer
                open={detailOpen}
                title="规则详情"
                onClose={() => setDetailOpen(false)}
                footer={null}
                width={640}
            >
                {selected && (
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>规则名称</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{selected.name}</div>
                        </Col>
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>规则编码</div>
                            <div style={{ fontSize: 14, fontFamily: 'monospace' }}>{selected.code}</div>
                        </Col>
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>业务对象</div>
                            <Tag style={{ fontSize: 12 }}>{BIZ_OBJECT_LABELS[selected.bizObject]}</Tag>
                        </Col>
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>优先级</div>
                            <div style={{ fontSize: 14 }}>{selected.priority}</div>
                        </Col>
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>版本</div>
                            <div style={{ fontSize: 14 }}>v{selected.version}</div>
                        </Col>
                        <Col span={12}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>状态</div>
                            <Tag color={statusMeta[selected.status].color} style={{ fontSize: 11 }}>{statusMeta[selected.status].label}</Tag>
                        </Col>
                        <Col span={24}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>应用时机</div>
                            <Space size={4} wrap>
                                {selected.timing.map((t) => (
                                    <Tag key={t} style={{ fontSize: 11, margin: 0 }}>{TIMING_LABELS[t] || t}</Tag>
                                ))}
                            </Space>
                            {selected.timing.includes('scheduled') && selected.schedule && (
                                <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>
                                    定时设置：{formatScheduleDisplay(selected.schedule)}
                                </div>
                            )}
                        </Col>
                        <Col span={24}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>生效范围</div>
                            <div style={{ fontSize: 14 }}>
                                {selected.scopeType === 'all' ? '所有组织' : selected.scopeType === 'org' ? selected.scopeOrgs.join('、') : selected.scopeLines.join('、')}
                            </div>
                        </Col>
                        <Col span={24}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>描述</div>
                            <div style={{ fontSize: 13 }}>{selected.description}</div>
                        </Col>
                        <Col span={24}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>条件配置</div>
                            {selected.hasCondition ? (
                                <div className="admin-card" style={{ background: '#f5f5f5', fontSize: 12 }}>
                                    {selected.conditionGroups.map((group, gi) => (
                                        <React.Fragment key={group.id}>
                                            {gi > 0 && (
                                                <div style={{ textAlign: 'center', padding: '4px 0', color: '#1677ff', fontWeight: 600, fontSize: 11 }}>
                                                    ── {selected.conditionGroupsLogic || 'AND'} ──
                                                </div>
                                            )}
                                            <div style={{ marginBottom: gi < selected.conditionGroups.length - 1 ? 8 : 0 }}>
                                                <div style={{ fontWeight: 600, marginBottom: 4 }}>条件组 {gi + 1}（{group.logic === 'AND' ? '全部满足' : '任一满足'}）</div>
                                                {group.conditions.map((cond) => (
                                                    <div key={cond.id} style={{ paddingLeft: 12, lineHeight: '22px' }}>
                                                        {cond.field} {cond.operator} [{cond.valueType}] {String(cond.value)}
                                                    </div>
                                                ))}
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>无条件应用</div>
                            )}
                        </Col>
                        <Col span={24}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>动作配置</div>
                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                                {selected.actions.map((action, ai) => (
                                    <div key={action.id} className="admin-card" style={{ background: '#f5f5f5', fontSize: 12 }}>
                                        <div style={{ fontWeight: 600, marginBottom: 4 }}>动作 {ai + 1}：{ACTION_TYPE_LABELS[action.type] || action.type}</div>
                                        {action.condition ? (
                                            <div style={{ marginBottom: 6, paddingBottom: 6, borderBottom: '1px dashed #d9d9d9' }}>
                                                <div style={{ fontWeight: 600, marginBottom: 2, color: 'rgba(0,0,0,0.65)' }}>IF（{action.condition.logic === 'AND' ? '全部满足' : '任一满足'}）</div>
                                                {action.condition.conditions.map((cond) => (
                                                    <div key={cond.id} style={{ paddingLeft: 12, lineHeight: '20px' }}>
                                                        {cond.field} {cond.operator} [{cond.valueType}] {String(cond.value)}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ marginBottom: 6, paddingBottom: 6, borderBottom: '1px dashed #d9d9d9', color: 'rgba(0,0,0,0.45)' }}>
                                                IF（无条件）
                                            </div>
                                        )}
                                        <div style={{ fontWeight: 600, marginBottom: 2, color: 'rgba(0,0,0,0.65)' }}>THEN</div>
                                        <div style={{ paddingLeft: 12 }}>
                                            {Object.entries(action.params).map(([k, v]) => (
                                                <div key={k} style={{ lineHeight: '20px' }}>
                                                    {k}：{Array.isArray(v) ? v.join('、') : String(v)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </Space>
                        </Col>
                        <Col span={24}>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>高级配置</div>
                            <div className="admin-card" style={{ background: '#f5f5f5', fontSize: 12 }}>
                                <div>异步执行：{selected.advanced.async ? '是' : '否'}</div>
                                <div>最大重试：{selected.advanced.maxRetry} 次</div>
                                <div>超时时间：{selected.advanced.timeout} 秒</div>
                                <div>忽略异常：{selected.advanced.ignoreError ? '是' : '否'}</div>
                            </div>
                        </Col>
                    </Row>
                )}
            </Drawer>

            {/* 历史版本 */}
            <Modal
                open={historyOpen}
                title="规则版本历史"
                onCancel={() => setHistoryOpen(false)}
                footer={null}
                width={640}
            >
                <Table
                    rowKey="version"
                    pagination={false}
                    columns={[
                        { title: '版本', dataIndex: 'version' },
                        { title: '修改时间', dataIndex: 'time' },
                        { title: '修改人', dataIndex: 'operator' },
                        { title: '变更摘要', dataIndex: 'content' },
                        { title: '操作', key: 'action', render: () => <Button type="link" size="small">回滚</Button> },
                    ]}
                    dataSource={[
                        { version: 'v3', time: '2024-05-20', operator: '王志强', content: '优化热耗计算条件，增加产线范围限制' },
                        { version: 'v2', time: '2024-03-15', operator: '李明远', content: '增加煤耗低位热值校验条件' },
                        { version: 'v1', time: '2023-12-01', operator: '系统', content: '初始创建' },
                    ]}
                />
            </Modal>

            {/* 模拟运行 */}
            <Modal
                open={simulateOpen}
                title="规则模拟运行"
                onCancel={() => setSimulateOpen(false)}
                onOk={runSimulate}
            >
                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginBottom: 12 }}>
                    点击「运行」模拟触发规则引擎，查看在当前规则配置下哪些规则会被命中。
                </div>
                {simulateLog && (
                    <div className="admin-card" style={{ background: '#141414', color: '#f5f5f5', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-line' }}>
                        {simulateLog}
                    </div>
                )}
            </Modal>
        </div>
    );
}
