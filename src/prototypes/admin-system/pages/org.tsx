import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import {
    Building2,
    Plus,
    Pencil,
    Trash2,
    Clock,
    Search,
    Save,
} from 'lucide-react';
import {
    Tree,
    Button,
    Input,
    Modal,
    Form,
    Select,
    Switch,
    Tag,
    Table,
    Space,
    message,
    Row,
    Col,
    TreeSelect,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { ColumnsType } from 'antd/es/table';
import {
    baseOrgData,
    orgToTreeSelectData,
    productionLineTreeData,
    findProductionLinePath,
    resolveDepartmentProductionLines,
    type OrgType,
    type OrgNode,
} from './org-data';

 const orgTypeLabels: Record<OrgType, string> = {
    group: '集团',
    region: '区域公司',
    factory: '工厂',
    department: '部门',
    subDepartment: '二级部门',
};

const orgTypeColors: Record<OrgType, string> = {
    group: '#1677ff',
    region: '#0958d9',
    factory: '#52c41a',
    department: 'rgba(0,0,0,0.45)',
    subDepartment: 'rgba(0,0,0,0.25)',
};

 const tenantOptions = ['DCC项目部', '伊拉克区域公司', '苏州中材'];

 function findNode(nodes: OrgNode[], id: string): OrgNode | null {
    for (const n of nodes) {
        if (n.id === id) return n;
        if (n.children) {
            const found = findNode(n.children, id);
            if (found) return found;
        }
    }
    return null;
}

 function findParent(nodes: OrgNode[], childId: string): OrgNode | null {
    for (const n of nodes) {
        if (n.children?.some((c) => c.id === childId)) return n;
        if (n.children) {
            const found = findParent(n.children, childId);
            if (found) return found;
        }
    }
    return null;
}

 function flattenNodes(nodes: OrgNode[]): OrgNode[] {
    const result: OrgNode[] = [];
    function walk(list: OrgNode[]) {
        for (const n of list) {
            result.push(n);
            if (n.children) walk(n.children);
        }
    }
    walk(nodes);
    return result;
}

 function toTreeData(nodes: OrgNode[]): DataNode[] {
    return nodes.map((n) => ({
        key: n.id,
        title: (
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>{n.name}</span>
                <Tag style={{ fontSize: 12 }}>{orgTypeLabels[n.type]}</Tag>
            </span>
        ),
        children: n.children ? toTreeData(n.children) : undefined,
    }));
}

 export default function OrgPage() {
    const [selectedId, setSelectedId] = useState<string | null>('3');
    const [expanded, setExpanded] = useState<string[]>(['1', '2', '3']);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [form, setForm] = useState<Partial<OrgNode>>({});
    const [historyOpen, setHistoryOpen] = useState(false);
    const [treeData, setTreeData] = useState<OrgNode[]>(baseOrgData);

    const selectedNode = useMemo(() => {
        if (!selectedId) return null;
        return findNode(treeData, selectedId);
    }, [selectedId, treeData]);

    const parentNode = useMemo(() => {
        if (!selectedId) return null;
        return findParent(treeData, selectedId);
    }, [selectedId, treeData]);

    const openAdd = () => {
        setModalMode('add');
        setForm({
            type: 'factory',
            active: true,
            parentId: selectedNode?.id || '',
            tenant: 'DCC项目部',
        });
        setModalOpen(true);
    };

    const openEdit = () => {
        if (!selectedNode) return;
        setModalMode('edit');
        const parent = findParent(treeData, selectedNode.id);
        setForm({ ...selectedNode, parentId: parent?.id || '' });
        setModalOpen(true);
    };

    const handleSave = () => {
        setModalOpen(false);
        message.success('保存成功');
    };

    const treeNodes = useMemo(() => toTreeData(treeData), [treeData]);

    const historyColumns: ColumnsType<any> = [
        { title: '时间', dataIndex: 'time' },
        { title: '操作人', dataIndex: 'operator' },
        { title: '变更内容', dataIndex: 'content' },
        { title: '生效日期', dataIndex: 'date' },
    ];

    const historyData = [
        { key: '1', time: '2024-01-15 09:32', operator: '张建国', content: 'Duhok粉磨站划归伊拉克区域公司', date: '2021-09-10' },
        { key: '2', time: '2023-06-20 14:10', operator: '李明远', content: '新增中控室节点', date: '2023-07-01' },
        { key: '3', time: '2019-05-28 11:05', operator: '张建国', content: 'DCC水泥厂正式投产', date: '2019-06-01' },
        { key: '4', time: '2018-03-10 08:45', operator: '系统', content: '伊拉克区域公司成立', date: '2018-03-15' },
    ];

    return (
        <div>
            <div className="admin-split">
                <div data-annotation-id="org-tree-panel" className="admin-split-left" style={{ width: 320 }}>
                    <div style={{ padding: 12 }}>
                        <Input.Search
                            placeholder="搜索组织节点..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ marginBottom: 8 }}
                            allowClear
                        />
                        <Space style={{ marginBottom: 8 }}>
                            <Button size="small" icon={<Plus size={14} />} onClick={openAdd} />
                            <Button size="small" icon={<Pencil size={14} />} onClick={openEdit} />
                            <Button size="small" icon={<Trash2 size={14} />} />
                            <Button size="small" icon={<Clock size={14} />} onClick={() => setHistoryOpen(true)} />
                        </Space>
                        <Tree
                            className="org-tree"
                            treeData={treeNodes}
                            selectedKeys={selectedId ? [selectedId] : []}
                            expandedKeys={expanded}
                            onExpand={(keys) => setExpanded(keys as string[])}
                            onSelect={(keys) => setSelectedId(keys[0] as string || null)}
                        />
                    </div>
                </div>

                <div className="admin-split-right">
                    {selectedNode ? (
                        <div data-annotation-id="org-detail-card" className="admin-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div
                                    style={{
                                        width: 40,
                                        height: 40,
                                        background: orgTypeColors[selectedNode.type] + '15',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 8,
                                    }}
                                >
                                    <Building2 size={20} color={orgTypeColors[selectedNode.type]} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>{selectedNode.name}</h3>
                                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>
                                        {selectedNode.code} · {orgTypeLabels[selectedNode.type]}
                                    </div>
                                </div>
                                <Tag color={selectedNode.active ? 'success' : 'error'} style={{ marginLeft: 'auto' }}>
                                    {selectedNode.active ? '已启用' : '已停用'}
                                </Tag>
                            </div>

                            <Row gutter={[24, 16]}>
                                <Col span={8}>
                                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>机构名称</div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedNode.name}</div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>机构编码</div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedNode.code}</div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>所属租户</div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedNode.tenant || '-'}</div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>机构全称</div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedNode.fullName || '-'}</div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>上级机构</div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{parentNode?.name || '-'}</div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>机构类型</div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{orgTypeLabels[selectedNode.type]}</div>
                                </Col>
                                <Col span={8}>
                                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>是否启用</div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedNode.active ? '是' : '否'}</div>
                                </Col>
                                {(selectedNode.type === 'department' || selectedNode.type === 'subDepartment') && (
                                    <Col span={8}>
                                        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>管理产线</div>
                                        <div style={{ fontSize: 14, fontWeight: 500 }}>
                                            {(() => {
                                                const lines = selectedNode.type === 'department'
                                                    ? resolveDepartmentProductionLines(selectedNode)
                                                    : (selectedNode.productionLines || []);
                                                return lines.length > 0 ? (
                                                    <Space size={4} wrap>
                                                        {lines.map((line) => {
                                                            const path = findProductionLinePath(line);
                                                            return <Tag key={line}>{path || line}</Tag>;
                                                        })}
                                                    </Space>
                                                ) : '-';
                                            })()}
                                        </div>
                                    </Col>
                                )}
                            </Row>

                            {selectedNode.remark && (
                                <div style={{ marginTop: 16 }}>
                                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>备注</div>
                                    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', lineHeight: 1.6 }}>{selectedNode.remark}</div>
                                </div>
                            )}

                            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>子节点</div>
                                {selectedNode.children && selectedNode.children.length > 0 ? (
                                    <Space size={8} wrap>
                                        {selectedNode.children.map((child) => (
                                            <Tag
                                                key={child.id}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setSelectedId(child.id)}
                                            >
                                                {child.name}
                                            </Tag>
                                        ))}
                                    </Space>
                                ) : (
                                    <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>无子节点</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="admin-empty">请从左侧选择一个组织节点查看详情</div>
                    )}
                </div>
            </div>

            <Modal
                open={modalOpen}
                title={modalMode === 'add' ? '新增组织节点' : '编辑组织节点'}
                onCancel={() => setModalOpen(false)}
                onOk={handleSave}
                width={720}
            >
                <Form layout="vertical" data-annotation-id="annotation-13">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="机构名称" required>
                                <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="请输入机构名称" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="机构编码" required>
                                <Input value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="请输入机构编码" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="所属租户" required>
                                <Select
                                    value={form.tenant || ''}
                                    onChange={(v) => setForm({ ...form, tenant: v })}
                                    options={tenantOptions.map((t) => ({ value: t, label: t }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="机构全称">
                                <Input value={form.fullName || ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="请输入机构全称" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="上级机构">
                                <Select
                                    value={form.parentId || ''}
                                    onChange={(v) => setForm({ ...form, parentId: v })}
                                    placeholder="请选择上级机构"
                                    options={[{ value: '', label: '请选择上级机构' }, ...flattenNodes(treeData).map((n) => ({ value: n.id, label: n.name }))]}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="机构类型" required>
                                <Select
                                    value={form.type || ''}
                                    onChange={(v) => setForm({ ...form, type: v as OrgType })}
                                    options={Object.entries(orgTypeLabels).map(([k, v]) => ({ value: k, label: v }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    {(form.type === 'department' || form.type === 'subDepartment') && (
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item label="管理产线">
                                    <TreeSelect
                                        treeData={productionLineTreeData}
                                        value={form.productionLines || []}
                                        onChange={(v) => setForm({ ...form, productionLines: v as string[] })}
                                        treeCheckable
                                        showCheckedStrategy={TreeSelect.SHOW_PARENT}
                                        placeholder="请选择产线/工段"
                                        style={{ width: '100%' }}
                                        allowClear
                                        multiple
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                    <Form.Item label="是否启用">
                        <Switch checked={!!form.active} onChange={(v) => setForm({ ...form, active: v })} />
                    </Form.Item>
                    <Form.Item label="备注">
                        <Input.TextArea
                            value={form.remark || ''}
                            onChange={(e) => setForm({ ...form, remark: e.target.value.slice(0, 500) })}
                            placeholder="请输入备注"
                            maxLength={500}
                            showCount
                            rows={3}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                open={historyOpen}
                title="组织变更历史"
                onCancel={() => setHistoryOpen(false)}
                footer={null}
                width={640}
            >
                <Table columns={historyColumns} dataSource={historyData} pagination={false} />
            </Modal>
        </div>
    );
}
