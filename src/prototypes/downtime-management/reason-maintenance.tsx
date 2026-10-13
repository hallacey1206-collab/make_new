import React, { useMemo, useState } from 'react';
import {
    PlusOutlined,
    ImportOutlined,
    DeleteOutlined,
    SearchOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
    Button,
    Card,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Table,
    message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    dcsFaultCategoryOptions,
    initialDcsReasons,
    stopTypeOptions,
    type DcsReasonRecord,
    type DcsFaultCategory,
} from './data';

type FormValues = {
    dcsFaultCategory: DcsFaultCategory;
    dcsReasonCode: string;
    dcsReasonDesc: string;
    stopType: string;
};

function createBlank(): FormValues {
    return {
        dcsFaultCategory: '工艺连锁停机',
        dcsReasonCode: '',
        dcsReasonDesc: '',
        stopType: '',
    };
}

export default function ReasonMaintenancePage() {
    const [records, setRecords] = useState<DcsReasonRecord[]>(initialDcsReasons);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<DcsReasonRecord | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [filters, setFilters] = useState<{ keyword?: string; category?: string }>({});
    const [form] = Form.useForm<FormValues>();

    const filtered = useMemo(() => {
        const kw = String(filters.keyword || '').trim().toLowerCase();
        const cat = String(filters.category || '').trim();
        return records.filter((r) => {
            if (kw) {
                const combined = [r.dcsReasonCode, r.dcsReasonDesc, r.dcsFaultCategory]
                    .join(' ')
                    .toLowerCase();
                if (!combined.includes(kw)) return false;
            }
            if (cat && r.dcsFaultCategory !== cat) return false;
            return true;
        });
    }, [records, filters]);

    const openCreate = () => {
        setEditing(null);
        form.resetFields();
        const blank = createBlank();
        form.setFieldsValue(blank);
        setModalOpen(true);
    };

    const openEdit = (record: DcsReasonRecord) => {
        setEditing(record);
        form.setFieldsValue({
            dcsFaultCategory: record.dcsFaultCategory,
            dcsReasonCode: record.dcsReasonCode,
            dcsReasonDesc: record.dcsReasonDesc,
            stopType: record.stopType,
        });
        setModalOpen(true);
    };

    const handleSubmit = () => {
        form.validateFields().then((values) => {
            if (editing) {
                setRecords((prev) =>
                    prev.map((r) => (r.id === editing.id ? { ...r, ...values } : r))
                );
                message.success('已更新DCS表面原因映射。');
            } else {
                const newRecord: DcsReasonRecord = {
                    id: `dcs-${Date.now()}`,
                    ...values,
                    subType: '',
                };
                setRecords((prev) => [newRecord, ...prev]);
                message.success('已新增DCS表面原因映射。');
            }
            setModalOpen(false);
        });
    };

    const handleSingleDelete = (record: DcsReasonRecord) => {
        Modal.confirm({
            title: '确认删除',
            icon: <ExclamationCircleOutlined />,
            content: `确定要删除「${record.dcsReasonDesc}」吗？`,
            okText: '删除',
            okButtonProps: { danger: true },
            onOk: () => {
                setRecords((prev) => prev.filter((r) => r.id !== record.id));
                message.success('已删除该记录。');
            },
        });
    };

    const handleBatchDelete = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('请先勾选要删除的记录。');
            return;
        }
        Modal.confirm({
            title: '确认批量删除',
            icon: <ExclamationCircleOutlined />,
            content: `将删除选中的 ${selectedRowKeys.length} 条记录，是否继续？`,
            okText: '删除',
            okButtonProps: { danger: true },
            onOk: () => {
                setRecords((prev) => prev.filter((r) => !selectedRowKeys.includes(r.id)));
                setSelectedRowKeys([]);
                message.success('已删除选中的记录。');
            },
        });
    };

    const columns: ColumnsType<DcsReasonRecord> = [
        {
            title: 'DCS故障分类',
            dataIndex: 'dcsFaultCategory',
            width: 140,
            render: (val: string) => {
                const colorMap: Record<string, string> = {
                    '工艺连锁停机': 'orange',
                    '安全连锁停机': 'red',
                    '正常停机': 'green',
                    '其他': 'default',
                };
                const cls = val === '正常停机' ? 'running' : val === '安全连锁停机' ? 'stopped' : val === '其他' ? 'other' : 'warning';
                return <span className={`dtm-status-tag ${cls}`} style={{ border: 'none' }}>{val}</span>;
            },
        },
        { title: 'DCS表面原因码', dataIndex: 'dcsReasonCode', width: 120 },
        { title: 'DCS表面原因描述', dataIndex: 'dcsReasonDesc', ellipsis: true },
        {
            title: '停机类型',
            dataIndex: 'stopType',
            width: 100,
            render: (val: string) => val || <span style={{ color: '#bbb' }}>-</span>,
        },
        {
            title: '操作',
            width: 140,
            fixed: 'right' as const,
            render: (_, record) => (
                <Space size={0}>
                    <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} style={{ padding: '0 4px' }}>
                        编辑
                    </Button>
                    <Button size="small" type="link" danger icon={<DeleteOutlined />} onClick={() => handleSingleDelete(record)} style={{ padding: '0 4px' }}>
                        删除
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="dtm-page-stack">
            {/* 搜索筛选 */}
            <Card className="dtm-query-card" bordered={false} data-annotation-id="rm-query">
                <Form
                    layout="inline"
                    className="dtm-query-form"
                    onValuesChange={(_, all) => setFilters(all)}
                >
                    <Form.Item name="keyword" label="原因码/描述">
                        <Input allowClear placeholder="请输入原因码或描述" style={{ width: 220 }} />
                    </Form.Item>
                    <Form.Item name="category" label="故障分类">
                        <Select
                            allowClear
                            placeholder="请选择"
                            style={{ width: 160 }}
                            options={dcsFaultCategoryOptions}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                            <Button onClick={() => { setFilters({}); form.resetFields(); }}>重置</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            {/* 表格 */}
            <Card
                data-annotation-id="rm-table"
                title={
                    <Space wrap>
                        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增</Button>
                        <Button icon={<ImportOutlined />}>导入</Button>
                        <Button danger icon={<DeleteOutlined />} onClick={handleBatchDelete} disabled={selectedRowKeys.length === 0}>
                            批量删除
                        </Button>
                    </Space>
                }
            >
                <Table
                    rowKey="id"
                    dataSource={filtered}
                    columns={columns}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                    }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条`,
                    }}
                    size="small"
                />
                {/* 底部提示 */}
                <div className="dtm-hint-box" style={{ marginTop: 12 }}>
                    说明：停机类型可为空，表示该DCS表面原因暂未映射停机类型。请确保DCS原因码与DCS系统实际配置一致。
                </div>
            </Card>

            {/* 新增/编辑弹窗 */}
            <Modal
                title={editing ? '编辑' : '新增'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={handleSubmit}
                okText="保存"
                width={520}
                destroyOnClose
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="dcsFaultCategory"
                        label="DCS故障分类"
                        rules={[{ required: true, message: '请选择DCS故障分类' }]}
                    >
                        <Select options={dcsFaultCategoryOptions} />
                    </Form.Item>
                    <Form.Item
                        name="dcsReasonCode"
                        label="DCS停机原因码"
                        rules={[{ required: true, message: '请输入DCS停机原因码' }]}
                    >
                        <Input placeholder="如：305" maxLength={10} />
                    </Form.Item>
                    <Form.Item
                        name="dcsReasonDesc"
                        label="DCS停机原因描述"
                        rules={[{ required: true, message: '请输入DCS停机原因描述' }]}
                    >
                        <Input.TextArea rows={2} placeholder="如：上游设备故障" maxLength={100} />
                    </Form.Item>
                    <Form.Item name="stopType" label="停机类型">
                        <Select
                            allowClear
                            placeholder="请选择停机类型"
                            options={stopTypeOptions}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
