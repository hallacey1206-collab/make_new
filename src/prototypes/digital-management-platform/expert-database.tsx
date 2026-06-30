import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import {
    CloudDownloadOutlined,
    CloudUploadOutlined,
    DeleteOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    PlusOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Descriptions,
    Drawer,
    Form,
    Input,
    InputNumber,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    TreeSelect,
    Typography,
    message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TreeDataNode } from 'antd';
import {
    USER_POOL,
    initialExpertRecords,
    specialtyFieldOptions,
    companyOptions,
    type ExpertRecord,
    type SpecialtyField,
    type UserRecord,
} from './data';

const { Text } = Typography;

// ============ Context ============

type ExpertStoreValue = {
    experts: ExpertRecord[];
    addExpert: (record: ExpertRecord) => void;
    addExperts: (records: ExpertRecord[]) => void;
    updateExpert: (id: string, updates: Partial<Pick<ExpertRecord, 'specialtyField' | 'major' | 'majorYears'>>) => void;
    deleteExpert: (ids: string[]) => void;
    getExpertOptions: () => { value: string; label: string }[];
};

const ExpertStoreContext = createContext<ExpertStoreValue | null>(null);

const defaultStore: ExpertStoreValue = {
    experts: [] as ExpertRecord[],
    addExpert: () => {},
    addExperts: () => {},
    updateExpert: () => {},
    deleteExpert: () => {},
    getExpertOptions: () => [],
};

export function useExpertStore() {
    const store = useContext(ExpertStoreContext);
    return store || defaultStore;
}

export function ExpertStoreProvider({ children }: { children: React.ReactNode }) {
    const [experts, setExperts] = useState<ExpertRecord[]>(initialExpertRecords);

    const value = useMemo<ExpertStoreValue>(() => ({
        experts,
        addExpert: (record) => setExperts((prev) => [record, ...prev]),
        addExperts: (records) => setExperts((prev) => [...records, ...prev]),
        updateExpert: (id, updates) => setExperts((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e))),
        deleteExpert: (ids) => setExperts((prev) => prev.filter((e) => !ids.includes(e.id))),
        getExpertOptions: () => experts.map((e) => ({ value: e.name, label: `${e.name} \u00b7 ${e.specialtyField} \u00b7 ${e.org}` })),
    }), [experts]);

    return <ExpertStoreContext.Provider value={value}>{children}</ExpertStoreContext.Provider>;
}

// ============ 工具 ============

function genId() { return `_${Math.random().toString(36).slice(2, 9)}`; }
function nowStr() {
    const d = new Date();
    const p = (v: number) => String(v).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ============ 构建用户树（组织架构 + 用户叶子节点） ============

function buildUserTreeData(experts: ExpertRecord[]): TreeDataNode[] {
    // 按单位分组
    const orgMap = new Map<string, UserRecord[]>();
    USER_POOL.forEach((u) => {
        if (!orgMap.has(u.org)) orgMap.set(u.org, []);
        orgMap.get(u.org)!.push(u);
    });

    const expertUserIds = new Set(experts.map((e) => e.userId));

    return Array.from(orgMap.entries()).map(([org, users]) => ({
        title: org,
        value: `org-${org}`,
        key: `org-${org}`,
        selectable: false,
        disabled: true,
        children: users.map((u) => ({
            title: u.name,
            value: u.id,
            key: u.id,
            selectable: true,
            disabled: expertUserIds.has(u.id),
        })),
    }));
}

// ============ 添加/编辑专家抽屉 ============

function ExpertDrawer({
    open, onClose, onSave, editingExpert, experts,
}: {
    open: boolean; onClose: () => void;
    onSave: (record: ExpertRecord) => void;
    editingExpert: ExpertRecord | null;
    experts: ExpertRecord[];
}) {
    const [form] = Form.useForm();
    const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
    const isEdit = !!editingExpert;

    useEffect(() => {
        if (!open) return;
        if (editingExpert) {
            form.setFieldsValue({
                name: editingExpert.name,
                gender: editingExpert.gender,
                birthDate: editingExpert.birthDate,
                org: editingExpert.org,
                specialtyField: editingExpert.specialtyField,
                major: editingExpert.major,
                majorYears: editingExpert.majorYears,
            });
            setSelectedUser(null);
        } else {
            form.resetFields();
            form.setFieldsValue({ specialtyField: specialtyFieldOptions[0].value });
            setSelectedUser(null);
        }
    }, [open, editingExpert, form]);

    const handleUserSelect = (userId: string) => {
        const user = USER_POOL.find((u) => u.id === userId);
        if (!user) return;
        setSelectedUser(user);
        form.setFieldsValue({
            name: user.name,
            gender: user.gender,
            birthDate: user.birthDate,
            org: user.org,
        });
    };

    const userTreeData = useMemo(() => buildUserTreeData(experts), [experts]);

    const handleFinish = () => {
        form.validateFields().then((values) => {
            if (isEdit && editingExpert) {
                onSave({
                    ...editingExpert,
                    specialtyField: values.specialtyField,
                    major: values.major,
                    majorYears: values.majorYears,
                });
            } else {
                if (!selectedUser) {
                    message.warning('请先选择用户。');
                    return;
                }
                onSave({
                    id: genId(),
                    userId: selectedUser.id,
                    name: selectedUser.name,
                    gender: selectedUser.gender,
                    birthDate: selectedUser.birthDate,
                    org: selectedUser.org,
                    specialtyField: values.specialtyField,
                    major: values.major || '',
                    majorYears: values.majorYears || 0,
                    createTime: nowStr(),
                });
            }
        });
    };

    return (
        <Drawer
            title={isEdit ? '编辑专家' : '添加专家'}
            open={open}
            width={560}
            onClose={onClose}
            destroyOnClose
            extra={
                <Space>
                    <Button onClick={onClose}>取消</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleFinish}>
                        保存
                    </Button>
                </Space>
            }
        >
            <Form form={form} layout="vertical">
                {!isEdit && (
                    <Form.Item name="userId" label="选择用户" rules={[{ required: true, message: '请选择用户。' }]}>
                        <TreeSelect
                            showSearch
                            treeData={userTreeData}
                            placeholder="从组织架构中选取人员"
                            onChange={handleUserSelect}
                            treeDefaultExpandAll
                            filterTreeNode={(input, node) =>
                                String(node?.title ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                )}

                {!isEdit && (
                    <Form.Item name="name" label="姓名" style={{ display: 'none' }}>
                        <Input disabled />
                    </Form.Item>
                )}

                {!isEdit && selectedUser && (
                    <div style={{
                        padding: '10px 14px',
                        marginBottom: 16,
                        background: '#f6ffed',
                        borderRadius: 8,
                        border: '1px solid #b7eb8f',
                        fontSize: 13,
                        color: 'rgba(0,0,0,0.65)',
                    }}>
                        <Text strong style={{ fontSize: 14, color: '#135200' }}>{selectedUser.name}</Text>
                        <div style={{ marginTop: 4, display: 'flex', gap: 24 }}>
                            <span>{selectedUser.gender === '男' ? '♂' : '♀'} {selectedUser.gender}</span>
                            <span>{selectedUser.birthDate}</span>
                            <span>{selectedUser.org}</span>
                        </div>
                    </div>
                )}

                {isEdit && (
                    <>
                        <Form.Item name="name" label="姓名">
                            <Input disabled />
                        </Form.Item>
                        <Form.Item name="gender" label="性别">
                            <Input disabled />
                        </Form.Item>
                        <Form.Item name="birthDate" label="出生年月">
                            <Input disabled />
                        </Form.Item>
                        <Form.Item name="org" label="单位">
                            <Input disabled />
                        </Form.Item>
                    </>
                )}

                <Form.Item
                    name="specialtyField"
                    label="专业领域"
                    rules={[{ required: true, message: '请选择专业领域。' }]}
                >
                    <Select
                        placeholder="请选择专业领域"
                        options={specialtyFieldOptions}
                    />
                </Form.Item>

                <Form.Item
                    name="major"
                    label="专业"
                    rules={[{ required: true, message: '请输入专业。' }]}
                >
                    <Input placeholder="请输入专业" maxLength={50} />
                </Form.Item>

                <Form.Item
                    name="majorYears"
                    label="专业年限（年）"
                    rules={[{ required: true, message: '请输入专业年限。' }]}
                >
                    <InputNumber min={0} max={60} precision={0} placeholder="请输入专业年限" style={{ width: '100%' }} />
                </Form.Item>
            </Form>
        </Drawer>
    );
}

// ============ 批量导入弹窗 ============

function ImportModal({
    open,
    onClose,
    onImport,
    experts,
}: {
    open: boolean;
    onClose: () => void;
    onImport: (records: ExpertRecord[]) => void;
    experts: ExpertRecord[];
}) {
    const handleImportDemo = () => {
        const expertUserIds = new Set(experts.map((e) => e.userId));
        // 从未入库的用户中随机选几条
        const available = USER_POOL.filter((u) => !expertUserIds.has(u.id));
        if (available.length === 0) {
            message.warning('所有用户已入库，无新用户可导入。');
            return;
        }
        const count = Math.min(3, available.length);
        const shuffled = [...available].sort(() => Math.random() - 0.5).slice(0, count);
        const newExperts: ExpertRecord[] = shuffled.map((u, i) => ({
            id: genId() + i,
            userId: u.id,
            name: u.name,
            gender: u.gender,
            birthDate: u.birthDate,
            org: u.org,
            specialtyField: specialtyFieldOptions[i % specialtyFieldOptions.length].value,
            major: ['信息系统管理', '软件工程', '计算机科学', '信息安全'][i % 4],
            majorYears: 5 + Math.floor(Math.random() * 15),
            createTime: nowStr(),
        }));
        onImport(newExperts);
        message.success(`批量导入成功，已新增 ${newExperts.length} 位专家。`);
        onClose();
    };

    return (
        <Modal
            title="批量导入专家"
            open={open}
            onCancel={onClose}
            onOk={handleImportDemo}
            okText="生成示例数据"
        >
            <Alert
                type="warning"
                showIcon
                message="当前原型采用模拟导入方式，点击确认后会从未入库用户中生成示例专家数据。"
                style={{ marginBottom: 16 }}
            />
            <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="操作说明">支持 Excel/CSV 格式的专家导入模板，按模板字段填写后上传。</Descriptions.Item>
                <Descriptions.Item label="模板字段">用户姓名、专业领域、专业名称、专业年限</Descriptions.Item>
                <Descriptions.Item label="导入规则">只入库不重复用户，已有专家的用户自动跳过。</Descriptions.Item>
            </Descriptions>
        </Modal>
    );
}

// ============ 专家库主页面 ============

export default function ExpertDatabasePage() {
    const { experts, addExpert, addExperts, updateExpert, deleteExpert } = useExpertStore();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingExpert, setEditingExpert] = useState<ExpertRecord | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [importOpen, setImportOpen] = useState(false);
    const [filters, setFilters] = useState<{
        name?: string;
        org?: string;
        specialtyField?: string;
    }>({});

    const [form] = Form.useForm();

    const handleSearch = () => {
        setFilters(form.getFieldsValue());
    };

    const handleReset = () => {
        form.resetFields();
        setFilters({});
    };

    const openAddDrawer = () => {
        setEditingExpert(null);
        setDrawerOpen(true);
    };

    const openEditDrawer = (expert: ExpertRecord) => {
        setEditingExpert(expert);
        setDrawerOpen(true);
    };

    const handleSave = (record: ExpertRecord) => {
        if (editingExpert) {
            updateExpert(editingExpert.id, {
                specialtyField: record.specialtyField,
                major: record.major,
                majorYears: record.majorYears,
            });
            message.success('专家信息已更新。');
        } else {
            addExpert(record);
            message.success('专家已添加。');
        }
        setDrawerOpen(false);
        setEditingExpert(null);
    };

    const handleDelete = (expert: ExpertRecord) => {
        Modal.confirm({
            title: '确认移除该专家？',
            icon: <ExclamationCircleOutlined />,
            content: `确定要将 ${expert.name} 从专家库中移除吗？此操作不会删除该用户。`,
            okText: '确认移除',
            okButtonProps: { danger: true },
            cancelText: '取消',
            onOk: () => {
                deleteExpert([expert.id]);
                message.success(`已将 ${expert.name} 从专家库中移除。`);
            },
        });
    };

    const handleBatchDelete = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('请先勾选需要移除的专家。');
            return;
        }
        Modal.confirm({
            title: '确认批量移除专家？',
            icon: <ExclamationCircleOutlined />,
            content: `确定要将选中的 ${selectedRowKeys.length} 位专家从专家库中移除吗？此操作不会删除相关用户。`,
            okText: '确认移除',
            okButtonProps: { danger: true },
            cancelText: '取消',
            onOk: () => {
                deleteExpert(selectedRowKeys as string[]);
                message.success(`已成功移除 ${selectedRowKeys.length} 位专家。`);
                setSelectedRowKeys([]);
            },
        });
    };

    // 模板下载
    const handleDownloadTemplate = () => {
        const headers = ['姓名', '性别', '出生年月', '单位', '专业领域', '专业', '专业年限'];
        const rows = experts.slice(0, 2).map((e) => [
            e.name, e.gender, e.birthDate, e.org, e.specialtyField, e.major, String(e.majorYears),
        ]);
        const csv = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = '专家库导入模板.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        message.success('模板已下载（CSV 格式）。');
    };

    const filteredExperts = useMemo(() => {
        return experts.filter((e) => {
            const name = (filters.name || '').trim().toLowerCase();
            const org = (filters.org || '').trim();
            const sf = (filters.specialtyField || '').trim();
            if (name && !e.name.toLowerCase().includes(name)) return false;
            if (org && e.org !== org) return false;
            if (sf && e.specialtyField !== sf) return false;
            return true;
        });
    }, [experts, filters]);

    const orgOptions = useMemo(() => {
        const orgs = [...new Set(experts.map((e) => e.org))];
        return orgs.map((o) => ({ value: o, label: o }));
    }, [experts]);

    const columns: ColumnsType<ExpertRecord> = [
        {
            title: '姓名',
            dataIndex: 'name',
            width: 100,
        },
        {
            title: '性别',
            dataIndex: 'gender',
            width: 60,
        },
        {
            title: '出生年月',
            dataIndex: 'birthDate',
            width: 110,
        },
        {
            title: '单位',
            dataIndex: 'org',
            width: 150,
            ellipsis: true,
        },
        {
            title: '专业领域',
            dataIndex: 'specialtyField',
            width: 140,
            render: (field: SpecialtyField) => (
                <Tag color="blue">{field}</Tag>
            ),
        },
        {
            title: '专业',
            dataIndex: 'major',
            width: 160,
            ellipsis: true,
        },
        {
            title: '专业年限',
            dataIndex: 'majorYears',
            width: 100,
            render: (v: number) => `${v} 年`,
        },
        {
            title: '入库时间',
            dataIndex: 'createTime',
            width: 150,
        },
        {
            title: '操作',
            width: 140,
            fixed: 'right',
            render: (_, record) => (
                <Space size={4}>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditDrawer(record)}>
                        编辑
                    </Button>
                    <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                        移除
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="dmp-page-stack">
            <Card className="dmp-query-card" bordered={false}>
                <Form
                    form={form}
                    layout="inline"
                    className="dmp-query-form"
                    initialValues={{}}
                >
                    <Form.Item name="name" label="姓名">
                        <Input allowClear placeholder="请输入姓名" style={{ width: 180 }} />
                    </Form.Item>
                    <Form.Item name="org" label="单位">
                        <Select
                            allowClear
                            placeholder="请选择单位"
                            style={{ width: 200 }}
                            options={orgOptions}
                        />
                    </Form.Item>
                    <Form.Item name="specialtyField" label="专业领域">
                        <Select
                            allowClear
                            placeholder="请选择专业领域"
                            style={{ width: 180 }}
                            options={specialtyFieldOptions}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
                            <Button onClick={handleReset}>重置</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            <Card
                title={`专家列表（${filteredExperts.length} 人）`}
                extra={
                    <Space>
                        <Button icon={<CloudDownloadOutlined />} onClick={handleDownloadTemplate}>模板下载</Button>
                        <Button icon={<CloudUploadOutlined />} onClick={() => setImportOpen(true)}>批量导入</Button>
                        {selectedRowKeys.length > 0 && (
                            <Button danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>
                                批量移除（{selectedRowKeys.length}）
                            </Button>
                        )}
                        <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
                            添加专家
                        </Button>
                    </Space>
                }
            >
                <Table
                    rowKey="id"
                    dataSource={filteredExperts}
                    columns={columns}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                    }}
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 位专家`,
                        defaultPageSize: 10,
                        pageSizeOptions: ['10', '20', '50'],
                    }}
                    scroll={{ x: 1100 }}
                />
            </Card>

            <ExpertDrawer
                open={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setEditingExpert(null);
                }}
                onSave={handleSave}
                editingExpert={editingExpert}
                experts={experts}
            />

            <ImportModal
                open={importOpen}
                onClose={() => setImportOpen(false)}
                onImport={addExperts}
                experts={experts}
            />
        </div>
    );
}
