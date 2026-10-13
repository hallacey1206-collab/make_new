import React, { useMemo, useState } from 'react';
import {
    PlusOutlined,
    DeleteOutlined,
    EditOutlined,
    SearchOutlined,
    ReloadOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import {
    Button,
    Card,
    Form,
    Input,
    Radio,
    Select,
    Space,
    Table,
    Tag,
    Tabs,
    Typography,
    message,
} from 'antd';

const { Title, Text } = Typography;
const { TextArea } = Input;

// ============ 类型定义 ============
type MessageType = 'notification' | 'approval' | 'alarm' | 'system';
type SpecialtyType = 'equipment' | 'production' | 'quality';
type Priority = 'normal' | 'urgent';
type TemplateStatus = 'enabled' | 'disabled';

// 消息类型选项（用于列表查询和编辑表单）

const TYPE_OPTIONS = [
    { value: 'notification', label: '通知类' },
    { value: 'approval', label: '审批类' },
    { value: 'alarm', label: '待办类' },
    { value: 'system', label: '系统类' },
];

const SPECIALTY_OPTIONS = [
    { value: 'equipment', label: '设备' },
    { value: 'production', label: '生产' },
    { value: 'quality', label: '质量' },
];

const PRIORITY_OPTIONS = [
    { value: 'normal', label: '普通' },
    { value: 'urgent', label: '紧急' },
];

const STATUS_OPTIONS = [
    { value: 'enabled', label: '已启用' },
    { value: 'disabled', label: '已停用' },
];

type ParamRow = {
    key: string;
    paramKey: string;
    paramName: string;
    required: boolean;
    rule: string;
};

// ============ 模拟模板数据 ============
const MOCK_TEMPLATES: Array<{
    id: string;
    code: string;
    name: string;
    type: MessageType;
    sendMode: string;
    status: TemplateStatus;
    createTime: string;
}> = [
    { id: 'tpl-001', code: 'daily-production-report', name: '生产日报', type: 'notification', sendMode: '002', status: 'enabled', createTime: '2024-10-12 10:47:45' },
    { id: 'tpl-002', code: 'recordIndexOutOfRange', name: '质检指标超限告警', type: 'alarm', sendMode: '002', status: 'enabled', createTime: '2024-10-18 14:58:24' },
    { id: 'tpl-003', code: 'maintain_notify', name: '维修工单到期提醒', type: 'approval', sendMode: '002', status: 'enabled', createTime: '2024-10-21 17:10:47' },
    { id: 'tpl-004', code: 'RH_TODO_MSG', name: '润滑待办消息模板', type: 'notification', sendMode: '002', status: 'enabled', createTime: '2024-10-22 14:27:20' },
    { id: 'tpl-005', code: 'inspectionAgencyMatters', name: '巡检代办消息', type: 'notification', sendMode: '002', status: 'enabled', createTime: '2024-10-22 16:57:52' },
    { id: 'tpl-006', code: 'materialApply', name: '用料审批', type: 'approval', sendMode: '002', status: 'enabled', createTime: '2024-10-30 10:15:28' },
    { id: 'tpl-007', code: 'maintain_audit_agree', name: '维修工单审核通过提醒', type: 'approval', sendMode: '002', status: 'enabled', createTime: '2024-10-31 15:28:20' },
    { id: 'tpl-008', code: 'maintain_plan_over', name: '维修计划审核通过', type: 'approval', sendMode: '002', status: 'enabled', createTime: '2024-11-12 08:32:16' },
    { id: 'tpl-009', code: 'qmrd_approve_notice', name: '质量日报审核通知', type: 'notification', sendMode: '002', status: 'enabled', createTime: '2024-12-28 14:17:50' },
    { id: 'tpl-010', code: 'pmrd_approve_notice', name: '生产日报审核通知', type: 'notification', sendMode: '002', status: 'enabled', createTime: '2024-12-28 14:21:00' },
    { id: 'tpl-011', code: 'qywx-znx', name: '企业微信站内信', type: 'system', sendMode: '002', status: 'enabled', createTime: '2025-01-08 14:43:24' },
    { id: 'tpl-012', code: 'maintain_plan_approve', name: '维修计划节点审批提醒', type: 'approval', sendMode: '002', status: 'enabled', createTime: '2025-01-09 09:44:32' },
    { id: 'tpl-013', code: 'maintain_audit_approve', name: '维修工单待审批提醒', type: 'approval', sendMode: '002', status: 'enabled', createTime: '2025-01-09 09:46:49' },
    { id: 'tpl-014', code: 'materialApplyApprove', name: '用料待审批提醒', type: 'approval', sendMode: '002', status: 'enabled', createTime: '2025-01-09 09:48:34' },
];

const TYPE_LABEL: Record<MessageType, { label: string; color: string }> = {
    notification: { label: '通知类', color: 'blue' },
    approval: { label: '审批类', color: 'orange' },
    alarm: { label: '待办类', color: 'red' },
    system: { label: '系统类', color: 'default' },
};

// ============ 列表页 ============
function TemplateListPage({ onAdd, onEdit }: { onAdd: () => void; onEdit: (record: any) => void }) {
    const [selectedType, setSelectedType] = useState<string>('all');
    const [keywordCode, setKeywordCode] = useState('');
    const [keywordName, setKeywordName] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [data, setData] = useState(MOCK_TEMPLATES);
    const [page, setPage] = useState(1);
    const pageSize = 50;

    const filteredData = useMemo(() => {
        return data.filter((item) => {
            if (selectedType !== 'all' && item.type !== selectedType) return false;
            if (keywordCode.trim() && !item.code.toLowerCase().includes(keywordCode.trim().toLowerCase())) return false;
            if (keywordName.trim() && !item.name.toLowerCase().includes(keywordName.trim().toLowerCase())) return false;
            if (statusFilter !== 'all' && item.status !== statusFilter) return false;
            return true;
        });
    }, [data, selectedType, keywordCode, keywordName, statusFilter]);

    const handleDelete = (ids: string[]) => {
        if (ids.length === 0) {
            message.warning('请先选择要删除的模板');
            return;
        }
        setData((prev) => prev.filter((d) => !ids.includes(d.id)));
        setSelectedRows([]);
        message.success(`已删除 ${ids.length} 个模板`);
    };

    const columns = [
        { title: '模板编号', dataIndex: 'code', key: 'code', width: 220 },
        { title: '模板名称', dataIndex: 'name', key: 'name', width: 200 },
        {
            title: '消息类型',
            dataIndex: 'type',
            key: 'type',
            width: 120,
            render: (type: MessageType) => <Tag color={TYPE_LABEL[type].color}>{TYPE_LABEL[type].label}</Tag>,
        },
        { title: '发送模式', dataIndex: 'sendMode', key: 'sendMode', width: 100 },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: TemplateStatus) => (
                <Tag color={status === 'enabled' ? 'green' : 'default'}>
                    {status === 'enabled' ? '已启用' : '已停用'}
                </Tag>
            ),
        },
        { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
        {
            title: '操作',
            key: 'action',
            width: 140,
            fixed: 'right' as const,
            render: (_: any, record: any) => (
                <Space size="small">
                    <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => onEdit(record)}
                    >
                        编辑
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete([record.id])}
                    >
                        删除
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            {/* 顶部标题栏 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}>
                    消息模板管理
                </Title>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
                        新增
                    </Button>
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(selectedRows)}>
                        删除
                    </Button>
                </Space>
            </div>

            {/* 查询工具栏 */}
            <Card size="small" style={{ marginBottom: 16 }} styles={{ body: { padding: '12px 16px' } }}>
                <Space size={16} wrap>
                    <Space>
                        <span style={{ color: '#595959' }}>消息类型</span>
                        <Select
                            value={selectedType}
                            onChange={setSelectedType}
                            style={{ width: 120 }}
                            options={[
                                { value: 'all', label: '全部' },
                                ...TYPE_OPTIONS,
                            ]}
                        />
                    </Space>
                    <Space>
                        <span style={{ color: '#595959' }}>模板编号</span>
                        <Input
                            placeholder="模板编号"
                            value={keywordCode}
                            onChange={(e) => setKeywordCode(e.target.value)}
                            style={{ width: 160 }}
                            allowClear
                        />
                    </Space>
                    <Space>
                        <span style={{ color: '#595959' }}>模板名称</span>
                        <Input
                            placeholder="模板名称"
                            value={keywordName}
                            onChange={(e) => setKeywordName(e.target.value)}
                            style={{ width: 160 }}
                            allowClear
                        />
                    </Space>
                    <Space>
                        <span style={{ color: '#595959' }}>状态</span>
                        <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: 120 }}
                            options={[
                                { value: 'all', label: '全部' },
                                ...STATUS_OPTIONS,
                            ]}
                        />
                    </Space>
                    <Button type="primary" icon={<SearchOutlined />} onClick={() => setPage(1)}>
                        搜索
                    </Button>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                            setSelectedType('all');
                            setKeywordCode('');
                            setKeywordName('');
                            setStatusFilter('all');
                            setPage(1);
                        }}
                    >
                        刷新
                    </Button>
                </Space>
            </Card>

            {/* 数据表格 */}
            <Card styles={{ body: { padding: 0 } }}>
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={filteredData}
                    scroll={{ x: 1000 }}
                    pagination={false}
                    rowSelection={{
                        selectedRowKeys: selectedRows,
                        onChange: (keys) => setSelectedRows(keys as string[]),
                    }}
                    locale={{ emptyText: '暂无模板数据' }}
                />
                {/* 分页栏 */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderTop: '1px solid #f0f0f0',
                    }}
                >
                    <Text type="secondary">共 {filteredData.length} 条</Text>
                    <Space>
                        <Select
                            value={pageSize}
                            onChange={() => {}}
                            style={{ width: 110 }}
                            options={[{ value: 50, label: '50条/页' }]}
                        />
                        <Button
                            size="small"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            上一页
                        </Button>
                        <Text>第 {page} 页</Text>
                        <Button
                            size="small"
                            disabled={page * pageSize >= filteredData.length}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            下一页
                        </Button>
                        <Space size={4}>
                            <span>前往</span>
                            <Input
                                style={{ width: 56 }}
                                value={page}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    if (!isNaN(v) && v >= 1) setPage(v);
                                }}
                            />
                            <span>页</span>
                        </Space>
                    </Space>
                </div>
            </Card>
        </div>
    );
}

// ============ 新增/编辑页 ============
function TemplateEditPage({ record, onBack, onSave }: { record: any; onBack: () => void; onSave: () => void }) {
    const isEdit = !!record;
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('input-params');
    const [paramKeyword, setParamKeyword] = useState('');
    const [params, setParams] = useState<ParamRow[]>([
        { key: 'p1', paramKey: 'deviceName', paramName: '设备名称', required: true, rule: '非空' },
        { key: 'p2', paramKey: 'alarmTime', paramName: '报警时间', required: true, rule: '日期格式' },
        { key: 'p3', paramKey: 'alarmLevel', paramName: '报警等级', required: false, rule: '枚举' },
    ]);
    const [selectedParams, setSelectedParams] = useState<string[]>([]);

    const filteredParams = useMemo(
        () => params.filter((p) => !paramKeyword.trim() || p.paramKey.toLowerCase().includes(paramKeyword.trim().toLowerCase())),
        [params, paramKeyword]
    );

    const paramColumns = [
        {
            title: '参数键名',
            dataIndex: 'paramKey',
            key: 'paramKey',
            render: (v: string) => <Text code>{v}</Text>,
        },
        { title: '参数名称', dataIndex: 'paramName', key: 'paramName' },
        {
            title: '是否必填',
            dataIndex: 'required',
            key: 'required',
            render: (r: boolean) => (r ? <Tag color="red">必填</Tag> : <Tag>选填</Tag>),
        },
        { title: '参数规则', dataIndex: 'rule', key: 'rule' },
        {
            title: '操作',
            key: 'action',
            render: (_: any, row: ParamRow) => (
                <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() => setParams((prev) => prev.filter((p) => p.key !== row.key))}
                >
                    删除
                </Button>
            ),
        },
    ];

    const handleSave = () => {
        form.validateFields()
            .then(() => {
                message.success('保存成功');
                onSave();
            })
            .catch(() => {
                message.error('请完善必填项');
            });
    };

    return (
        <div>
            {/* 顶部操作栏 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}>
                    消息模板管理{isEdit ? '编辑' : '新增'}
                </Title>
                <Space>
                    <Button icon={<SaveOutlined />} onClick={handleSave}>
                        保存
                    </Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                        保存并返回
                    </Button>
                    <Button onClick={onBack}>取消</Button>
                </Space>
            </div>

            {/* 上部基础表单区 */}
            <Card size="small" style={{ marginBottom: 16 }}>
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        code: record?.code || '',
                        name: record?.name || '',
                        enabled: record ? (record.status === 'enabled' ? 'yes' : 'no') : 'yes',
                        type: record?.type || undefined,
                        description: '',
                        appPath: '',
                        pcPath: '',
                        specialty: record?.specialty || undefined,
                        priority: record?.priority || 'normal',
                    }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: 24 }}>
                        <Form.Item label="模板编号" name="code" rules={[{ required: true, message: '请输入模板编号' }]}>
                            <Input maxLength={40} placeholder="模板编号" />
                        </Form.Item>
                        <Form.Item label="模板名称" name="name" rules={[{ required: true, message: '请输入模板名称' }]}>
                            <Input maxLength={50} placeholder="模板名称" />
                        </Form.Item>
                        <Form.Item label="是否启用" name="enabled" rules={[{ required: true }]}>
                            <Radio.Group>
                                <Radio value="yes">是</Radio>
                                <Radio value="no">否</Radio>
                            </Radio.Group>
                        </Form.Item>
                        {/* 消息类型下拉：依照批注改为通知类、审批类、待办类、系统类 */}
                        <Form.Item label="消息类型" name="type" rules={[{ required: true, message: '请选择消息类型' }]}>
                            <Select placeholder="请选择" allowClear options={TYPE_OPTIONS} />
                        </Form.Item>
                        {/* 专业类型下拉：依照批注新增，选项设备/生产/质量 */}
                        <Form.Item label="专业类型" name="specialty" rules={[{ required: true, message: '请选择专业类型' }]}>
                            <Select placeholder="请选择" allowClear options={SPECIALTY_OPTIONS} />
                        </Form.Item>
                        {/* 紧急程度下拉：依照批注新增，选项普通/紧急 */}
                        <Form.Item label="紧急程度" name="priority" rules={[{ required: true, message: '请选择紧急程度' }]}>
                            <Select placeholder="请选择" allowClear options={PRIORITY_OPTIONS} />
                        </Form.Item>
                    </div>
                    <Form.Item label="模板描述" name="description">
                        <TextArea maxLength={200} placeholder="模板描述" rows={2} />
                    </Form.Item>
                    <Form.Item label="app路径" name="appPath">
                        <TextArea maxLength={200} placeholder="app路径" rows={1} />
                    </Form.Item>
                    <Form.Item label="pc路径" name="pcPath">
                        <TextArea maxLength={200} placeholder="pc路径" rows={1} />
                    </Form.Item>
                </Form>
            </Card>

            {/* 下部标签页功能区 */}
            <Card size="small" styles={{ body: { padding: 0 } }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    style={{ padding: '0 16px' }}
                    items={[
                        {
                            key: 'input-params',
                            label: '输入参数',
                            children: (
                                <div style={{ padding: '16px 0' }}>
                                    <Space style={{ marginBottom: 12 }} wrap>
                                        <Input
                                            placeholder="参数键名"
                                            value={paramKeyword}
                                            onChange={(e) => setParamKeyword(e.target.value)}
                                            style={{ width: 180 }}
                                            allowClear
                                        />
                                        <Button type="primary" icon={<SearchOutlined />}>
                                            搜索
                                        </Button>
                                        <Button icon={<ReloadOutlined />} onClick={() => setParamKeyword('')}>
                                            重置
                                        </Button>
                                    </Space>
                                    <Space style={{ marginBottom: 12, marginLeft: 8 }} wrap>
                                        <Button icon={<SaveOutlined />} onClick={handleSave}>
                                            保存
                                        </Button>
                                        <Button
                                            icon={<PlusOutlined />}
                                            onClick={() =>
                                                setParams((prev) => [
                                                    ...prev,
                                                    { key: `p${Date.now()}`, paramKey: '', paramName: '', required: false, rule: '' },
                                                ])
                                            }
                                        >
                                            新增
                                        </Button>
                                        <Button
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => setParams((prev) => prev.filter((p) => !selectedParams.includes(p.key)))}
                                        >
                                            删除
                                        </Button>
                                    </Space>
                                    <Table
                                        rowKey="key"
                                        size="small"
                                        columns={paramColumns}
                                        dataSource={filteredParams}
                                        pagination={false}
                                        rowSelection={{
                                            selectedRowKeys: selectedParams,
                                            onChange: (keys) => setSelectedParams(keys as string[]),
                                        }}
                                    />
                                </div>
                            ),
                        },
                        {
                            key: 'related',
                            label: '相关方',
                            children: <div style={{ padding: 24, color: '#8c8c8c' }}>相关方配置（待补充）</div>,
                        },
                        {
                            key: 'rules',
                            label: '消息规则',
                            children: <div style={{ padding: 24, color: '#8c8c8c' }}>消息规则配置（待补充）</div>,
                        },
                        {
                            key: 'channels',
                            label: '发送通道',
                            children: <div style={{ padding: 24, color: '#8c8c8c' }}>发送通道配置（待补充）</div>,
                        },
                    ]}
                />
            </Card>
        </div>
    );
}

// ============ 模板管理主组件 ============
export default function TemplateManageApp() {
    const [pageMode, setPageMode] = useState<'list' | 'edit'>('list');
    const [editingRecord, setEditingRecord] = useState<any>(null);

    const handleAdd = () => {
        setEditingRecord(null);
        setPageMode('edit');
    };

    const handleEdit = (record: any) => {
        setEditingRecord(record);
        setPageMode('edit');
    };

    const handleBack = () => {
        setPageMode('list');
        setEditingRecord(null);
    };

    const handleSave = () => {
        setPageMode('list');
        setEditingRecord(null);
    };

    return (
        <div style={{ padding: 24 }}>
            {pageMode === 'list' ? (
                <TemplateListPage onAdd={handleAdd} onEdit={handleEdit} />
            ) : (
                <TemplateEditPage record={editingRecord} onBack={handleBack} onSave={handleSave} />
            )}
        </div>
    );
}
