import React, { useMemo, useState } from 'react';
import type { TreeDataNode } from 'antd';
import {
    CheckCircleOutlined,
    CloudDownloadOutlined,
    ExclamationCircleOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SearchOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import {
    Button,
    Card,
    Checkbox,
    Col,
    Descriptions,
    Divider,
    Drawer,
    Form,
    Input,
    Modal,
    Row,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    Tree,
    message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    budgetBuildTypeOptions,
    buildModeOptions,
    budgetPlanYear,
    currentPlanYear,
    getBudgetStatusColor,
    getBudgetStatusLabel,
    orgTreeData,
    type BudgetRecord,
    type BudgetStatus,
    type BudgetTabType,
    type BudgetRound,
} from './data';
import { useBudgetStore } from './budget-fill';

// ============ Helpers ============

function formatMoney(value: number) {
    return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value?: string) {
    if (!value) return '-';
    return value.slice(0, 10);
}

function getOptionLabel(options: { value: string; label: string }[], val: string) {
    return options.find((o) => o.value === val)?.label?.split(' | ')[1] || val || '-';
}

function downloadTextFile(filename: string, content: string) {
    if (typeof document === 'undefined') return;
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function normalizeSelectedKeys(value: string | string[] | undefined) {
    if (typeof value === 'string') return [value];
    return Array.isArray(value) ? value : [];
}

// ============ Detail Drawer ============

function BudgetReviewDrawer({
    open,
    record,
    onClose,
    onApprove,
    onReturn,
}: {
    open: boolean;
    record: BudgetRecord | null;
    onClose: () => void;
    onApprove: (id: string, remark?: string) => void;
    onReturn: (id: string, remark: string) => void;
}) {
    const [remark, setRemark] = useState('');

    React.useEffect(() => {
        if (open) setRemark('');
    }, [open]);

    if (!record) return null;

    const handleApprove = () => {
        onApprove(record.id, remark);
    };

    const handleReturn = () => {
        if (!remark.trim()) {
            message.warning('退回时请填写审核意见。');
            return;
        }
        onReturn(record.id, remark);
    };

    return (
        <Drawer
            title="预算审核详情"
            open={open}
            width={960}
            onClose={onClose}
            destroyOnClose
            extra={
                <Space>
                    <Button onClick={onClose}>取消</Button>
                    <Button danger onClick={handleReturn}>退回</Button>
                    <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApprove}>
                        通过
                    </Button>
                </Space>
            }
        >
            <Descriptions title="基本信息" bordered column={3} size="small">
                <Descriptions.Item label="预算编号">{record.budgetCode}</Descriptions.Item>
                <Descriptions.Item label="项目名称" span={2}>{record.projectName}</Descriptions.Item>
                <Descriptions.Item label="预算分类">
                    {record.budgetCategory === '01' ? '项目类' : '非项目类'}
                </Descriptions.Item>
                <Descriptions.Item label="单位名称">{record.unitName}</Descriptions.Item>
                <Descriptions.Item label="版本号">{record.version}</Descriptions.Item>
                <Descriptions.Item label="审核状态">
                    <Tag color={getBudgetStatusColor(record.status)}>{getBudgetStatusLabel(record.status)}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="是否关联投资计划">
                    {record.linkedToInvestmentPlan === '01' ? '是' : '否'}
                </Descriptions.Item>
                {record.linkedToInvestmentPlan === '01' && (
                    <Descriptions.Item label="投资计划名称" span={2}>
                        {record.investmentPlanName || '-'}
                    </Descriptions.Item>
                )}
                <Descriptions.Item label="建设模式">
                    {getOptionLabel(buildModeOptions, record.buildMode)}
                </Descriptions.Item>
                <Descriptions.Item label="建设类型">
                    {getOptionLabel(budgetBuildTypeOptions, record.buildType)}
                </Descriptions.Item>
                <Descriptions.Item label="会计核算科目">{record.accountingSubject}</Descriptions.Item>
                <Descriptions.Item label="归口部门">{record.managedDept}</Descriptions.Item>
                <Descriptions.Item label="负责人">{record.responsiblePerson}</Descriptions.Item>
                <Descriptions.Item label="项目类别">{record.projectCategory}</Descriptions.Item>
                <Descriptions.Item label="项目简述" span={3}>{record.projectBrief}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="业务属性" bordered column={3} size="small">
                <Descriptions.Item label="企业类型">{record.enterpriseType}</Descriptions.Item>
                <Descriptions.Item label="五大举措分类">{record.fiveMeasuresCategory}</Descriptions.Item>
                <Descriptions.Item label="举措细分项">{record.measureSubItem}</Descriptions.Item>
                <Descriptions.Item label="所属业务域">{record.businessDomain}</Descriptions.Item>
                <Descriptions.Item label="五化">{record.fiveTransformation}</Descriptions.Item>
                <Descriptions.Item label="项目目标">{record.projectGoal}</Descriptions.Item>
                <Descriptions.Item label="目标内容" span={3}>{record.goalContent}</Descriptions.Item>
                <Descriptions.Item label="是否支持第二曲线">
                    {record.supportSecondCurve === '01' ? '是' : '否'}
                </Descriptions.Item>
                <Descriptions.Item label="项目计划进度">{record.planProgress}</Descriptions.Item>
                <Descriptions.Item label="是否已包含在其他预算中">
                    {record.includedInOtherBudget === '01' ? '是' : '否'}
                </Descriptions.Item>
                {record.includedInOtherBudget === '01' && (
                    <Descriptions.Item label="其他预算名称" span={2}>
                        {record.otherBudgetName || '-'}
                    </Descriptions.Item>
                )}
            </Descriptions>

            <Divider />

            <Descriptions title="时间与资金" bordered column={3} size="small">
                <Descriptions.Item label="项目启动时间">{formatDate(record.startDate)}</Descriptions.Item>
                <Descriptions.Item label="项目预计完成时间">{formatDate(record.endDate)}</Descriptions.Item>
                <Descriptions.Item label="总额(万元)">¥ {formatMoney(record.totalInvestment)}</Descriptions.Item>
                <Descriptions.Item label="自有资金(万元)">¥ {formatMoney(record.selfFunding)}</Descriptions.Item>
                <Descriptions.Item label="外部资金(万元)">¥ {formatMoney(record.externalFunding)}</Descriptions.Item>
                <Descriptions.Item label="其他资金(万元)">¥ {formatMoney(record.otherFunding)}</Descriptions.Item>
                <Descriptions.Item label="软件投入(万元)">¥ {formatMoney(record.softwareFunding)}</Descriptions.Item>
                <Descriptions.Item label="硬件投入(万元)">¥ {formatMoney(record.hardwareFunding)}</Descriptions.Item>
                <Descriptions.Item label="其他技术投入(万元)">¥ {formatMoney(record.otherTechFunding)}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="流程信息" bordered column={2} size="small">
                <Descriptions.Item label="创建人">{record.creator}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{record.updatedAt}</Descriptions.Item>
                {record.submitTime && (
                    <Descriptions.Item label="提交时间">{record.submitTime}</Descriptions.Item>
                )}
                {record.reviewer && (
                    <Descriptions.Item label="审核人">{record.reviewer}</Descriptions.Item>
                )}
                {record.reviewTime && (
                    <Descriptions.Item label="审核时间">{record.reviewTime}</Descriptions.Item>
                )}
                {record.reviewRemark && (
                    <Descriptions.Item label="审核意见" span={2}>{record.reviewRemark}</Descriptions.Item>
                )}
            </Descriptions>

            <Divider />

            <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>审核意见</div>
                <Input.TextArea
                    rows={3}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="请输入审核意见（退回时必填）"
                    maxLength={200}
                    showCount
                />
            </div>
        </Drawer>
    );
}

// ============ Budget Review Page ============

// 在途预算：审批节点不在当前用户的预算（模拟：以下 id 处于其他审批节点）
const transitBudgetIds = ['budget-013', 'budget-014'];

function isTransitBudget(record: BudgetRecord) {
    return transitBudgetIds.includes(record.id);
}

function BudgetReviewPage() {
    const { records, approveBudgets, returnBudgets } = useBudgetStore();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detailRecord, setDetailRecord] = useState<BudgetRecord | null>(null);
    const [activeTab, setActiveTab] = useState<BudgetTabType>('inner');
    const [listTab, setListTab] = useState<'review' | 'approved' | 'completed' | 'transit'>('review');
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [filters, setFilters] = useState<{ keyword?: string; year?: string }>({ year: `${budgetPlanYear}年` });
    const [selectedOrgKey, setSelectedOrgKey] = useState('group');
    const [includeChildren, setIncludeChildren] = useState(true);
    const [treeSearch, setTreeSearch] = useState('');
    const [treeExpandedKeys, setTreeExpandedKeys] = useState<string[]>(['group']);
    const [treeCollapsed, setTreeCollapsed] = useState(false);

    // ============ Tree helpers ============

    const filterTreeData = (nodes: TreeDataNode[], keyword: string): TreeDataNode[] => {
        const kw = keyword.trim().toLowerCase();
        if (!kw) return nodes;
        return nodes.reduce<TreeDataNode[]>((acc, node) => {
            const title = String(node.title).toLowerCase();
            const filteredChildren = node.children ? filterTreeData(node.children as TreeDataNode[], keyword) : [];
            if (title.includes(kw) || filteredChildren.length > 0) {
                acc.push({
                    ...node,
                    children: filteredChildren.length > 0 ? filteredChildren : node.children,
                });
            }
            return acc;
        }, []);
    };

    const treeData = useMemo(
        () => filterTreeData(orgTreeData as TreeDataNode[], treeSearch),
        [treeSearch],
    );

    const coloredTreeData = useMemo(() => {
        const getChildStats = (node: TreeDataNode): string => {
            if (!node.children || node.children.length === 0) return '';
            const children = node.children as TreeDataNode[];
            const total = children.length;
            const filled = children.filter((child) => {
                const childKey = child.key as string;
                return records.some((r) => r.unitName.includes(String(child.title)));
            }).length;
            return `（${filled}/${total}）`;
        };
        const applyStats = (nodes: TreeDataNode[]): TreeDataNode[] =>
            nodes.map((node) => ({
                ...node,
                title: `${node.title}${getChildStats(node)}`,
                children: node.children ? applyStats(node.children as TreeDataNode[]) : node.children,
            }));
        return applyStats(treeData);
    }, [treeData, records]);

    const expandedKeys = useMemo(() => {
        const kw = treeSearch.trim().toLowerCase();
        if (!kw) return treeExpandedKeys;
        const result: string[] = [];
        const walk = (nodes: TreeDataNode[], parentKeys: string[]) => {
            nodes.forEach((node) => {
                const title = String(node.title).toLowerCase();
                const childKeys = [...parentKeys, node.key as string];
                if (title.includes(kw)) {
                    result.push(...childKeys);
                }
                if (node.children) {
                    walk(node.children as TreeDataNode[], childKeys);
                }
            });
        };
        walk(orgTreeData as TreeDataNode[], []);
        return result;
    }, [treeSearch, treeExpandedKeys]);

    const handleTreeExpand = (keys: React.Key[]) => {
        setTreeExpandedKeys(keys as string[]);
    };

    // ============ Data filtering ============

    // 审核页展示待我审核、我已审核、已完结、在途四类预算（不含草稿与退回）
    const baseRecords = useMemo(() => {
        return records.filter(
            (record) =>
                record.tabType === activeTab &&
                (record.status === 'pending-review' || record.status === 'approved' || record.status === 'completed'),
        );
    }, [records, activeTab]);

    const applyFilters = useMemo(() => {
        return (list: BudgetRecord[]) => {
            const keyword = String(filters.keyword || '').trim().toLowerCase();
            const year = String(filters.year || '').replace('年', '').trim();
            const roundOrder: Record<BudgetRound, number> = { first: 3, second: 2, third: 1 };

            return list.filter((record) => {
                if (keyword) {
                    const combined = [record.projectName, record.budgetCode, record.unitName]
                        .join(' ')
                        .toLowerCase();
                    if (!combined.includes(keyword)) return false;
                }
                if (year && !record.budgetCode.includes(year)) return false;
                return true;
            }).sort((a, b) => roundOrder[a.round] - roundOrder[b.round]);
        };
    }, [filters]);

    const reviewRecords = useMemo(() => applyFilters(baseRecords.filter((r) => r.status === 'pending-review' && !isTransitBudget(r))), [baseRecords, applyFilters]);
    const approvedRecords = useMemo(() => applyFilters(baseRecords.filter((r) => r.status === 'approved')), [baseRecords, applyFilters]);
    const completedRecords = useMemo(() => applyFilters(baseRecords.filter((r) => r.status === 'completed')), [baseRecords, applyFilters]);
    const transitRecords = useMemo(() => applyFilters(baseRecords.filter((r) => r.status === 'pending-review' && isTransitBudget(r))), [baseRecords, applyFilters]);

    const displayRecords = listTab === 'approved'
        ? approvedRecords
        : listTab === 'completed'
            ? completedRecords
            : listTab === 'transit'
                ? transitRecords
                : reviewRecords;

    // ============ Actions ============

    const openDetail = (record: BudgetRecord) => {
        setDetailRecord(record);
        setDrawerOpen(true);
    };

    const handleApproveOne = (id: string, remark?: string) => {
        approveBudgets([id], remark);
        message.success('已通过该预算审核。');
        setDrawerOpen(false);
        setDetailRecord(null);
        setSelectedRowKeys([]);
    };

    const handleReturnOne = (id: string, remark: string) => {
        returnBudgets([id], remark);
        message.success('已退回该预算。');
        setDrawerOpen(false);
        setDetailRecord(null);
        setSelectedRowKeys([]);
    };

    const handleBatchApprove = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('请先选择需要审核的预算。');
            return;
        }
        Modal.confirm({
            title: '确认批量通过',
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
            content: `确认通过选中的 ${selectedRowKeys.length} 条预算？`,
            okText: '通过',
            cancelText: '取消',
            onOk: () => {
                approveBudgets(selectedRowKeys as string[]);
                message.success(`已通过 ${selectedRowKeys.length} 条预算审核。`);
                setSelectedRowKeys([]);
            },
        });
    };

    const handleBatchReturn = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('请先选择需要退回的预算。');
            return;
        }
        let returnRemark = '';
        Modal.confirm({
            title: '确认批量退回',
            icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
            content: (
                <div>
                    <p>确认退回选中的 {selectedRowKeys.length} 条预算？</p>
                    <Input.TextArea
                        rows={2}
                        placeholder="请输入退回原因（必填）"
                        onChange={(e) => { returnRemark = e.target.value; }}
                    />
                </div>
            ),
            okText: '退回',
            okButtonProps: { danger: true },
            cancelText: '取消',
            onOk: () => {
                if (!returnRemark.trim()) {
                    message.warning('退回时请填写审核意见。');
                    return Promise.reject();
                }
                returnBudgets(selectedRowKeys as string[], returnRemark);
                message.success(`已退回 ${selectedRowKeys.length} 条预算。`);
                setSelectedRowKeys([]);
            },
        });
    };

    const handleExport = () => {
        const header = ['预算编号', '项目名称', '单位名称', '预算分类', '建设模式', '建设类型', '项目简述', '启动时间', '预计完成时间', '总额(万元)', '版本号', '审核状态'];
        const rows = displayRecords.map((record) => [
            record.budgetCode,
            record.projectName,
            record.unitName,
            record.budgetCategory === '01' ? '项目类' : '非项目类',
            getOptionLabel(buildModeOptions, record.buildMode),
            getOptionLabel(budgetBuildTypeOptions, record.buildType),
            record.projectBrief,
            record.startDate,
            record.endDate,
            String(record.totalInvestment),
            record.version,
            getBudgetStatusLabel(record.status),
        ]);
        const content = [header, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        downloadTextFile(`预算审核-${Date.now()}.csv`, content);
        message.success('已导出审核列表（CSV 演示版）。');
    };

    const roundLabels: Record<BudgetRound, string> = { first: '一上', second: '二上', third: '三上' };

    const columns: ColumnsType<BudgetRecord> = [
        {
            title: '序号',
            width: 60,
            render: (_, __, index) => index + 1,
        },
        {
            title: '轮次',
            dataIndex: 'round',
            width: 80,
            fixed: 'left',
            render: (round: BudgetRound) => roundLabels[round],
        },
        {
            title: '项目名称',
            dataIndex: 'projectName',
            width: 180,
            ellipsis: true,
            fixed: 'left',
            render: (text: string) => (
                <Space size={4}>
                    <WarningOutlined style={{ color: '#faad14', fontSize: 14 }} />
                    <span>{text}</span>
                </Space>
            ),
        },
        {
            title: '单位名称',
            dataIndex: 'unitName',
            width: 120,
            ellipsis: true,
        },
        {
            title: '预算分类',
            dataIndex: 'budgetCategory',
            width: 90,
            render: (val: string) => val === '01' ? '项目类' : '非项目类',
        },
        {
            title: '建设模式',
            dataIndex: 'buildMode',
            width: 100,
            render: (val: string) => getOptionLabel(buildModeOptions, val),
        },
        {
            title: '建设类型',
            dataIndex: 'buildType',
            width: 80,
            render: (val: string) => getOptionLabel(budgetBuildTypeOptions, val),
        },
        {
            title: '项目简述',
            dataIndex: 'projectBrief',
            width: 160,
            ellipsis: true,
        },
        {
            title: '项目启动时间',
            dataIndex: 'startDate',
            width: 120,
            render: formatDate,
        },
        {
            title: '项目预计完成时间',
            dataIndex: 'endDate',
            width: 140,
            render: formatDate,
        },
        {
            title: '状态',
            width: 100,
            render: (_, record) => {
                if (record.status === 'completed') return <Tag color="success">已完结</Tag>;
                if (record.status === 'approved') return <Tag color="processing">待审批</Tag>;
                return isTransitBudget(record) ? <Tag color="cyan">在途</Tag> : <Tag color="processing">待审核</Tag>;
            },
        },
        {
            title: '操作',
            width: 120,
            fixed: 'right',
            render: (_, record) => (
                <Button size="small" type="link" onClick={() => openDetail(record)}>
                    查看
                </Button>
            ),
        },
    ];

    const tabLabels: Record<BudgetTabType, string> = {
        inner: '本年预算内预算审核',
        outer: '本年预算外预算审核',
    };

    return (
        <div className="dmp-page-stack">
            <Card bordered={false} data-annotation-id="budget-review-tabs">
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => {
                        setActiveTab(key as BudgetTabType);
                        setSelectedRowKeys([]);
                    }}
                    tabBarExtraContent={
                        listTab === 'review' ? (
                            <Space>
                                <Button icon={<CloudDownloadOutlined />} onClick={handleExport}>导出</Button>
                                <Button onClick={handleBatchReturn} disabled={reviewRecords.length === 0}>退回</Button>
                                <Button type="primary" danger onClick={handleBatchApprove} disabled={reviewRecords.length === 0}>
                                    通过
                                </Button>
                            </Space>
                        ) : null
                    }
                    items={[
                        { key: 'inner', label: tabLabels.inner },
                        { key: 'outer', label: tabLabels.outer },
                    ]}
                />
            </Card>

            <Row gutter={16}>
                {treeCollapsed ? (
                    <Col flex="32px">
                        <div style={{ position: 'relative', height: '100%' }}>
                            <Button
                                type="text"
                                icon={<MenuUnfoldOutlined />}
                                title="展开组织树"
                                onClick={() => setTreeCollapsed(false)}
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 12,
                                    width: 32,
                                    height: 48,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid #d9d9d9',
                                    borderLeft: 'none',
                                    borderTopRightRadius: 6,
                                    borderBottomRightRadius: 6,
                                    background: '#fff',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                    zIndex: 10,
                                }}
                            />
                        </div>
                    </Col>
                ) : (
                <Col xs={24} lg={5}>
                    <Card className="dmp-card-fill" data-annotation-id="budget-review-tree">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontWeight: 600, fontSize: 14, lineHeight: '22px' }}>组织树</span>
                            <Space size={4}>
                                <Checkbox
                                    checked={includeChildren}
                                    onChange={(e) => setIncludeChildren(e.target.checked)}
                                >
                                    包含下级
                                </Checkbox>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<MenuFoldOutlined />}
                                    title="收起组织树"
                                    onClick={() => setTreeCollapsed(true)}
                                />
                            </Space>
                        </div>
                        <Input
                            allowClear
                            placeholder="输入关键字进行过滤"
                            value={treeSearch}
                            onChange={(e) => setTreeSearch(e.target.value)}
                            style={{ marginBottom: 12 }}
                        />
                        <Tree
                            treeData={coloredTreeData}
                            expandedKeys={expandedKeys}
                            selectedKeys={normalizeSelectedKeys(selectedOrgKey)}
                            onExpand={handleTreeExpand}
                            onSelect={(keys) => setSelectedOrgKey((keys[0] as string) || 'group')}
                        />
                    </Card>
                </Col>
                )}
                <Col xs={24} lg={19}>
                    <Card bordered={false} data-annotation-id="budget-review-table">
                        <Tabs
                            activeKey={listTab}
                            onChange={(key) => {
                                setListTab(key as 'review' | 'approved' | 'completed' | 'transit');
                                setSelectedRowKeys([]);
                            }}
                            items={[
                                { key: 'review', label: `待我审核 (${reviewRecords.length})` },
                                { key: 'approved', label: `我已审核 (${approvedRecords.length})` },
                                { key: 'completed', label: `已完结 (${completedRecords.length})` },
                                { key: 'transit', label: `在途 (${transitRecords.length})` },
                            ]}
                        />
                        <Table
                            rowKey="id"
                            dataSource={displayRecords}
                            columns={columns}
                            pagination={{
                                showSizeChanger: true,
                                showTotal: (total) => `共 ${total} 条`,
                                defaultPageSize: 10,
                            }}
                            scroll={{ x: 1800 }}
                        />
                    </Card>
                </Col>
            </Row>

            <BudgetReviewDrawer
                open={drawerOpen}
                record={detailRecord}
                onClose={() => {
                    setDrawerOpen(false);
                    setDetailRecord(null);
                }}
                onApprove={handleApproveOne}
                onReturn={handleReturnOne}
            />
        </div>
    );
}

export default BudgetReviewPage;
