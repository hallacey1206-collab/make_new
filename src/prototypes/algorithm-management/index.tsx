/**
 * @name 智能监控原型
 * @mode axure
 */

import React, { useMemo, useState } from 'react';
import {
    HomeOutlined,
    SearchOutlined,
    ReloadOutlined,
    PlusOutlined,
    EllipsisOutlined,
    FolderOutlined,
    ApiOutlined,
    DesktopOutlined,
} from '@ant-design/icons';
import {
    Breadcrumb,
    Button,
    Card,
    ConfigProvider,
    DatePicker,
    Dropdown,
    Form,
    Input,
    InputNumber,
    Modal,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    Tree,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { defineHashPageRoute, useHashPage } from '../../common/useHashPage';
import {
    algorithmCategories,
    initialModels,
    type AlgorithmModel,
    nodeTreeData,
    type TreeNode,
    nodeInfoMap,
    type NodeInfo,
    initialDeployModels,
    type DeployModel,
    type DeployStatus,
    initialTasks,
    type AlgorithmTask,
    type TaskStatus,
} from './data';
import './style.css';

const { RangePicker } = DatePicker;
const { TreeNode: AntTreeNode } = Tree;

// 双页面路由（10-1 算法管理 + 10-2 算法配置）
const route = defineHashPageRoute([
    { id: 'algorithm-management', title: '10-1 算法管理' },
    { id: 'algorithm-config', title: '10-2 算法配置' },
], {
    defaultPageId: 'algorithm-management',
});

// ============ 10-1 算法管理 ============
function AlgorithmManagementPage() {
    const [models, setModels] = useState<AlgorithmModel[]>(initialModels);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const [filterKeyword, setFilterKeyword] = useState('');
    const [filterCategory, setFilterCategory] = useState<string | undefined>();
    const [filterRange, setFilterRange] = useState<[string, string] | null>(null);

    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [modalOpen, setModalOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<AlgorithmModel | null>(null);
    const [form] = Form.useForm();

    const filteredModels = useMemo(() => {
        return models.filter((m) => {
            if (filterKeyword) {
                const kw = filterKeyword.toLowerCase();
                if (!m.code.toLowerCase().includes(kw) && !m.name.includes(filterKeyword)) {
                    return false;
                }
            }
            if (filterCategory && m.category !== filterCategory) {
                return false;
            }
            if (filterRange) {
                const time = m.updateTime;
                if (time < filterRange[0] || time > `${filterRange[1]} 23:59:59`) {
                    return false;
                }
            }
            return true;
        });
    }, [models, filterKeyword, filterCategory, filterRange]);

    const pageData = filteredModels.slice((page - 1) * pageSize, page * pageSize);

    const handleReset = () => {
        setFilterKeyword('');
        setFilterCategory(undefined);
        setFilterRange(null);
        setPage(1);
    };

    const openAddModal = () => {
        setEditingModel(null);
        form.resetFields();
        setModalOpen(true);
    };

    const openEditModal = (record: AlgorithmModel) => {
        setEditingModel(record);
        form.setFieldsValue(record);
        setModalOpen(true);
    };

    const handleDelete = (record: AlgorithmModel) => {
        setModels((prev) => prev.filter((m) => m.key !== record.key));
    };

    const handleModalOk = () => {
        form.validateFields().then((values) => {
            if (editingModel) {
                setModels((prev) =>
                    prev.map((m) =>
                        m.key === editingModel.key
                            ? { ...m, ...values, version: values.version ?? m.version }
                            : m,
                    ),
                );
            } else {
                const newModel: AlgorithmModel = {
                    key: String(Date.now()),
                    index: models.length + 1,
                    code: values.code,
                    name: values.name,
                    enName: values.enName || '-',
                    category: values.category,
                    tag: values.tag || '-',
                    updateTime: values.updateTime?.format('YYYY-MM-DD HH:mm:ss') || '-',
                    version: values.version ?? 1,
                };
                setModels((prev) => [...prev, newModel]);
            }
            setModalOpen(false);
        });
    };

    const columns: ColumnsType<AlgorithmModel> = [
        { title: '模型编码', dataIndex: 'code', key: 'code', width: 100 },
        { title: '模型名称', dataIndex: 'name', key: 'name', width: 160 },
        { title: '英文名称', dataIndex: 'enName', key: 'enName', width: 220 },
        { title: '算法类别', dataIndex: 'category', key: 'category', width: 120 },
        {
            title: '标签', dataIndex: 'tag', key: 'tag', width: 140,
            render: (tag: string) => <Tag className="algo-tag">{tag}</Tag>,
        },
        { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 200, sorter: (a, b) => a.updateTime.localeCompare(b.updateTime) },
        { title: '版本号', dataIndex: 'version', key: 'version', width: 100 },
        {
            title: '操作', key: 'action', width: 140,
            render: (_, record) => (
                <Space size={0} split={<span className="algo-op-sep">|</span>}>
                    <Button type="link" size="small" className="algo-link" onClick={() => openEditModal(record)}>编辑</Button>
                    <Button type="link" size="small" className="algo-link-danger" onClick={() => handleDelete(record)}>删除</Button>
                    <Dropdown menu={{ items: [{ key: 'detail', label: '详情' }, { key: 'copy', label: '复制' }, { key: 'history', label: '版本历史' }] }}>
                        <EllipsisOutlined className="algo-more" />
                    </Dropdown>
                </Space>
            ),
        },
    ];

    return (
        <div className="algo-shell">
            <div className="algo-breadcrumb">
                <Breadcrumb items={[
                    { title: <HomeOutlined className="algo-crumb-home" /> },
                    { title: '系统首页' },
                    { title: '二级页面' },
                    { title: '10-1 算法管理' },
                ]} />
            </div>
            <Card className="algo-filter-card" variant="borderless">
                <div className="algo-filter-row">
                    <div className="algo-filter-left">
                        <div className="algo-filter-item">
                            <span className="algo-filter-label">模型编码 :</span>
                            <Input className="algo-input" placeholder="请输入模型编码或名称" value={filterKeyword} onChange={(e) => setFilterKeyword(e.target.value)} />
                        </div>
                        <div className="algo-filter-item">
                            <span className="algo-filter-label">算法类别 :</span>
                            <Select className="algo-select" placeholder="请选择算法类别" allowClear value={filterCategory} onChange={setFilterCategory} options={algorithmCategories.map((c) => ({ label: c, value: c }))} />
                        </div>
                        <div className="algo-filter-item">
                            <span className="algo-filter-label">更新时间 :</span>
                            <RangePicker className="algo-range" onChange={(_, dateStrings) => setFilterRange(dateStrings[0] ? [dateStrings[0], dateStrings[1]] : null)} />
                        </div>
                    </div>
                    <div className="algo-filter-right">
                        <Button className="algo-btn-reset" icon={<ReloadOutlined />} onClick={handleReset}>重 置</Button>
                        <Button type="primary" icon={<SearchOutlined />} onClick={() => setPage(1)}>查 询</Button>
                    </div>
                </div>
            </Card>
            <Card className="algo-table-card" variant="borderless">
                <div className="algo-table-header">
                    <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>新增模型</Button>
                </div>
                <Table<AlgorithmModel>
                    className="algo-table" rowKey="key" columns={columns} dataSource={pageData}
                    pagination={{
                        current: page, pageSize, total: filteredModels.length, onChange: setPage,
                        showTotal: (total) => `第 ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} 条 / 共 ${total} 条`,
                        showSizeChanger: false,
                    }}
                    rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
                />
            </Card>
            <Modal title={editingModel ? '编辑模型' : '新增模型'} open={modalOpen} onOk={handleModalOk} onCancel={() => setModalOpen(false)} width={560} okText="确 定" cancelText="取 消">
                <Form form={form} layout="vertical" className="algo-modal-form">
                    <Form.Item label="模型编码" name="code" rules={[{ required: true, message: '请输入模型编码' }]}>
                        <Input placeholder="请输入模型编码" />
                    </Form.Item>
                    <Form.Item label="模型名称" name="name" rules={[{ required: true, message: '请输入模型名称' }]}>
                        <Input placeholder="请输入模型名称" />
                    </Form.Item>
                    <Form.Item label="英文名称" name="enName">
                        <Input placeholder="请输入英文名称" />
                    </Form.Item>
                    <Form.Item label="算法类别" name="category" rules={[{ required: true, message: '请选择算法类别' }]}>
                        <Select placeholder="请选择算法类别" options={algorithmCategories.map((c) => ({ label: c, value: c }))} />
                    </Form.Item>
                    <Form.Item label="标签" name="tag">
                        <Input placeholder="请输入标签" />
                    </Form.Item>
                    <Form.Item label="版本号" name="version">
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入版本号" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

// ============ 10-2 算法配置 ============

// 部署状态颜色映射
const deployStatusColor: Record<DeployStatus, string> = {
    '未部署': 'default',
    '部署失败': 'error',
    '部署成功': 'success',
    '部署中': 'processing',
};

// 任务状态颜色映射
const taskStatusColor: Record<TaskStatus, string> = {
    '执行中': 'success',
    '已停止': 'default',
    '连接中': 'processing',
};

// 渲染节点树
function renderTreeNodes(nodes: TreeNode[]): React.ReactNode {
    return nodes.map((node) => ({
        key: node.key,
        title: node.mac ? `${node.title}（${node.mac}）` : node.title,
        icon: node.type === 'device' ? <ApiOutlined /> : <DesktopOutlined />,
        children: node.children ? renderTreeNodes(node.children) : undefined,
    }));
}

function AlgorithmConfigPage() {
    const [selectedNodeKey, setSelectedNodeKey] = useState<string>('1');
    const [activeTab, setActiveTab] = useState('node-info');

    // 模型管理
    const [deployModels, setDeployModels] = useState<DeployModel[]>(initialDeployModels);
    const [deploySelectedKeys, setDeploySelectedKeys] = useState<React.Key[]>([]);
    const [deployFilterKeyword, setDeployFilterKeyword] = useState('');
    const [deployFilterCategory, setDeployFilterCategory] = useState<string | undefined>();
    const [deployPage, setDeployPage] = useState(1);
    const deployPageSize = 10;

    // 算法任务
    const [tasks, setTasks] = useState<AlgorithmTask[]>(initialTasks);
    const [taskSelectedKeys, setTaskSelectedKeys] = useState<React.Key[]>([]);
    const [taskFilterKeyword, setTaskFilterKeyword] = useState('');
    const [taskFilterSource, setTaskFilterSource] = useState('');
    const constTaskPage = 1;
    const taskPageSize = 10;

    // 节点信息
    const nodeInfo: NodeInfo | undefined = nodeInfoMap[selectedNodeKey];

    const filteredDeployModels = useMemo(() => {
        return deployModels.filter((m) => {
            if (deployFilterKeyword) {
                const kw = deployFilterKeyword.toLowerCase();
                if (!m.code.toLowerCase().includes(kw) && !m.name.includes(deployFilterKeyword)) {
                    return false;
                }
            }
            if (deployFilterCategory && m.category !== deployFilterCategory) {
                return false;
            }
            return true;
        });
    }, [deployModels, deployFilterKeyword, deployFilterCategory]);

    const deployPageData = filteredDeployModels.slice((deployPage - 1) * deployPageSize, deployPage * deployPageSize);

    const filteredTasks = useMemo(() => {
        return tasks.filter((t) => {
            if (taskFilterKeyword) {
                const kw = taskFilterKeyword.toLowerCase();
                if (!t.code.toLowerCase().includes(kw) && !t.name.includes(taskFilterKeyword)) {
                    return false;
                }
            }
            if (taskFilterSource && !t.videoSource.includes(taskFilterSource)) {
                return false;
            }
            return true;
        });
    }, [tasks, taskFilterKeyword, taskFilterSource]);

    const taskPageData = filteredTasks.slice((constTaskPage - 1) * taskPageSize, constTaskPage * taskPageSize);

    const handleDeploy = (record: DeployModel) => {
        setDeployModels((prev) => prev.map((m) => m.key === record.key ? { ...m, status: '部署中' } : m));
    };
    const handleRemoveModel = (record: DeployModel) => {
        setDeployModels((prev) => prev.filter((m) => m.key !== record.key));
    };
    const handleReconnect = (record: DeployModel) => {
        setDeployModels((prev) => prev.map((m) => m.key === record.key ? { ...m, status: '部署中' } : m));
    };
    const handleRefreshStatus = () => {
        // 模拟刷新：随机切换部署中状态
        setDeployModels((prev) => prev.map((m) => m.status === '部署中' ? { ...m, status: Math.random() > 0.5 ? '部署成功' : '部署失败' } : m));
    };

    const handleStopTask = (record: AlgorithmTask) => {
        setTasks((prev) => prev.map((t) => t.key === record.key ? { ...t, status: '已停止' } : t));
    };
    const handleStartTask = (record: AlgorithmTask) => {
        setTasks((prev) => prev.map((t) => t.key === record.key ? { ...t, status: '执行中' } : t));
    };
    const handleDeleteTask = (record: AlgorithmTask) => {
        setTasks((prev) => prev.filter((t) => t.key !== record.key));
    };
    const handleEditTask = (_record: AlgorithmTask) => {
        // 占位
    };

    const deployColumns: ColumnsType<DeployModel> = [
        { title: '#', dataIndex: 'index', key: 'index', width: 50, align: 'center' },
        { title: '模型编码', dataIndex: 'code', key: 'code', width: 120 },
        { title: '模型名称', dataIndex: 'name', key: 'name', width: 140 },
        { title: '分类', dataIndex: 'category', key: 'category', width: 120 },
        { title: '当前版本', dataIndex: 'currentVersion', key: 'currentVersion', width: 90, align: 'center' },
        { title: '最新版本', dataIndex: 'latestVersion', key: 'latestVersion', width: 90, align: 'center' },
        {
            title: '状态', dataIndex: 'status', key: 'status', width: 100, align: 'center',
            render: (status: DeployStatus) => <Tag color={deployStatusColor[status]}>{status}</Tag>,
        },
        {
            title: '操作', key: 'action', width: 130,
            render: (_, record) => (
                <Space size={0} split={<span className="algo-op-sep">|</span>}>
                    {(record.status === '未部署' || record.status === '部署失败') && (
                        <Button type="link" size="small" className="algo-link" onClick={() => handleDeploy(record)}>部署</Button>
                    )}
                    {record.status === '部署中' && (
                        <Button type="link" size="small" className="algo-link" onClick={() => handleReconnect(record)}>重连</Button>
                    )}
                    <Button type="link" size="small" className="algo-link-danger" onClick={() => handleRemoveModel(record)}>移除</Button>
                </Space>
            ),
        },
    ];

    const taskColumns: ColumnsType<AlgorithmTask> = [
        { title: '#', dataIndex: 'index', key: 'index', width: 50, align: 'center' },
        { title: '任务编码', dataIndex: 'code', key: 'code', width: 100 },
        { title: '任务名称', dataIndex: 'name', key: 'name', width: 200 },
        { title: '视频源', dataIndex: 'videoSource', key: 'videoSource', width: 100 },
        { title: '模型名称', dataIndex: 'modelName', key: 'modelName', width: 120 },
        { title: '当前版本', dataIndex: 'currentVersion', key: 'currentVersion', width: 90, align: 'center' },
        {
            title: '状态', dataIndex: 'status', key: 'status', width: 100, align: 'center',
            render: (status: TaskStatus) => <Tag color={taskStatusColor[status]}>{status}</Tag>,
        },
        {
            title: '操作', key: 'action', width: 160,
            render: (_, record) => (
                <Space size={0} split={<span className="algo-op-sep">|</span>}>
                    {record.status === '执行中' && (
                        <Button type="link" size="small" className="algo-link" onClick={() => handleStopTask(record)}>停止</Button>
                    )}
                    {record.status === '已停止' && (
                        <>
                            <Button type="link" size="small" className="algo-link" onClick={() => handleStartTask(record)}>启动</Button>
                            <Button type="link" size="small" className="algo-link" onClick={() => handleEditTask(record)}>编辑</Button>
                        </>
                    )}
                    {record.status === '连接中' && (
                        <Button type="link" size="small" className="algo-link" onClick={() => handleStopTask(record)}>停止</Button>
                    )}
                    <Button type="link" size="small" className="algo-link-danger" onClick={() => handleDeleteTask(record)}>删除</Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="algo-shell">
            <div className="algo-breadcrumb">
                <Breadcrumb items={[
                    { title: <HomeOutlined className="algo-crumb-home" /> },
                    { title: '系统首页' },
                    { title: '二级页面' },
                    { title: '10-2 算法配置' },
                ]} />
            </div>
            <div className="algo-config-layout">
                {/* 左侧节点配置 */}
                <div className="algo-config-sidebar">
                    <div className="algo-config-sidebar-header">
                        <span className="algo-config-sidebar-title">节点配置</span>
                        <Button type="text" size="small" icon={<PlusOutlined />} className="algo-config-add-btn" />
                    </div>
                    <div className="algo-config-search">
                        <Input.Search placeholder="搜索树" size="middle" />
                    </div>
                    <div className="algo-config-tree">
                        <Tree
                            treeData={renderTreeNodes(nodeTreeData)}
                            defaultExpandAll
                            selectedKeys={[selectedNodeKey]}
                            onSelect={(keys) => keys[0] && setSelectedNodeKey(keys[0] as string)}
                            showIcon
                        />
                    </div>
                </div>

                {/* 右侧主体 */}
                <div className="algo-config-main">
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={[
                            {
                                key: 'node-info',
                                label: '节点信息',
                                children: (
                                    <div className="algo-config-node-info">
                                        <div className="algo-info-item">
                                            <div className="algo-info-label">节点类型</div>
                                            <div className="algo-info-value">{nodeInfo?.nodeType || '-'}</div>
                                        </div>
                                        <div className="algo-info-item">
                                            <div className="algo-info-label">父节点</div>
                                            <div className="algo-info-value">{nodeInfo?.parentNode || '-'}</div>
                                        </div>
                                        <div className="algo-info-item">
                                            <div className="algo-info-label">节点编码</div>
                                            <div className="algo-info-value">{nodeInfo?.nodeCode || '-'}</div>
                                        </div>
                                        <div className="algo-info-item">
                                            <div className="algo-info-label">节点名称</div>
                                            <div className="algo-info-value">{nodeInfo?.nodeName || '-'}</div>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: 'model-management',
                                label: '模型管理',
                                children: (
                                    <>
                                        <Card className="algo-filter-card" variant="borderless">
                                            <div className="algo-filter-row">
                                                <div className="algo-filter-left">
                                                    <div className="algo-filter-item">
                                                        <span className="algo-filter-label">模型编码 :</span>
                                                        <Input className="algo-input" placeholder="请输入模型编码或名称" value={deployFilterKeyword} onChange={(e) => setDeployFilterKeyword(e.target.value)} />
                                                    </div>
                                                    <div className="algo-filter-item">
                                                        <span className="algo-filter-label">算法类别 :</span>
                                                        <Select className="algo-select" placeholder="请选择算法类别" allowClear value={deployFilterCategory} onChange={setDeployFilterCategory} options={algorithmCategories.map((c) => ({ label: c, value: c }))} />
                                                    </div>
                                                </div>
                                                <div className="algo-filter-right">
                                                    <Button className="algo-btn-reset" icon={<ReloadOutlined />} onClick={() => { setDeployFilterKeyword(''); setDeployFilterCategory(undefined); setDeployPage(1); }}>重 置</Button>
                                                    <Button type="primary" icon={<SearchOutlined />} onClick={() => setDeployPage(1)}>查 询</Button>
                                                </div>
                                            </div>
                                        </Card>
                                        <Card className="algo-table-card" variant="borderless">
                                            <div className="algo-table-header">
                                                <Button type="primary" icon={<PlusOutlined />}>添加模型</Button>
                                                <Button icon={<ReloadOutlined />} onClick={handleRefreshStatus}>状态刷新</Button>
                                            </div>
                                            <Table<DeployModel>
                                                className="algo-table" rowKey="key" columns={deployColumns} dataSource={deployPageData}
                                                pagination={{
                                                    current: deployPage, pageSize: deployPageSize, total: filteredDeployModels.length, onChange: setDeployPage,
                                                    showTotal: (total) => `第 ${(deployPage - 1) * deployPageSize + 1}-${Math.min(deployPage * deployPageSize, total)} 条 / 共 ${total} 条`,
                                                    showSizeChanger: false,
                                                }}
                                                rowSelection={{ selectedRowKeys: deploySelectedKeys, onChange: setDeploySelectedKeys }}
                                            />
                                        </Card>
                                    </>
                                ),
                            },
                            {
                                key: 'algorithm-task',
                                label: '算法任务',
                                children: (
                                    <>
                                        <Card className="algo-filter-card" variant="borderless">
                                            <div className="algo-filter-row">
                                                <div className="algo-filter-left">
                                                    <div className="algo-filter-item">
                                                        <span className="algo-filter-label">任务编码 :</span>
                                                        <Input className="algo-input" placeholder="请输入任务编码或名称" value={taskFilterKeyword} onChange={(e) => setTaskFilterKeyword(e.target.value)} />
                                                    </div>
                                                    <div className="algo-filter-item">
                                                        <span className="algo-filter-label">视频源 :</span>
                                                        <Input className="algo-input" placeholder="请输入视频源" value={taskFilterSource} onChange={(e) => setTaskFilterSource(e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="algo-filter-right">
                                                    <Button className="algo-btn-reset" icon={<ReloadOutlined />} onClick={() => { setTaskFilterKeyword(''); setTaskFilterSource(''); }}>重 置</Button>
                                                    <Button type="primary" icon={<SearchOutlined />}>查 询</Button>
                                                </div>
                                            </div>
                                        </Card>
                                        <Card className="algo-table-card" variant="borderless">
                                            <div className="algo-table-header">
                                                <Button type="primary" icon={<PlusOutlined />}>添加任务</Button>
                                                <Button icon={<ReloadOutlined />}>状态刷新</Button>
                                            </div>
                                            <Table<AlgorithmTask>
                                                className="algo-table" rowKey="key" columns={taskColumns} dataSource={taskPageData}
                                                pagination={{
                                                    current: constTaskPage, pageSize: taskPageSize, total: filteredTasks.length,
                                                    showTotal: (total) => `第 ${(constTaskPage - 1) * taskPageSize + 1}-${Math.min(constTaskPage * taskPageSize, total)} 条 / 共 ${total} 条`,
                                                    showSizeChanger: false,
                                                }}
                                                rowSelection={{ selectedRowKeys: taskSelectedKeys, onChange: setTaskSelectedKeys }}
                                            />
                                        </Card>
                                    </>
                                ),
                            },
                        ]}
                    />
                </div>
            </div>
        </div>
    );
}

// ============ 主组件 ============
export default function Component() {
    const { page, setPage } = useHashPage(route);

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#1677ff',
                    borderRadius: 4,
                    fontSize: 14,
                },
            }}
        >
            {page === 'algorithm-config' ? <AlgorithmConfigPage /> : <AlgorithmManagementPage />}
        </ConfigProvider>
    );
}
