import React, { useCallback, useMemo, useState } from 'react';
import type { TabsProps } from 'antd';
import type { TreeDataNode } from 'antd';
import {
    CloudDownloadOutlined,
    SearchOutlined,
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
    budgetCategoryOptions,
    buildModeOptions,
    budgetPlanYear,
    currentPlanYear,
    getBudgetStatusColor,
    getBudgetStatusLabel,
    initialBudgetRecords,
    orgTreeData,
    type BudgetRecord,
    type BudgetStatus,
    type BudgetTabType,
    type BudgetRound,
} from './data';

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
    if (typeof value === 'string') {
        return [value];
    }
    return Array.isArray(value) ? value : [];
}

// ============ Detail Drawer ============

function BudgetDetailDrawer({
    open,
    record,
    onClose,
}: {
    open: boolean;
    record: BudgetRecord | null;
    onClose: () => void;
}) {
    if (!record) return null;

    return (
        <Drawer
            title="预算详情"
            open={open}
            width={960}
            onClose={onClose}
            destroyOnClose
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
                <Descriptions.Item label="会计核算科目">
                    {record.accountingSubject}
                </Descriptions.Item>
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
        </Drawer>
    );
}

// ============ Budget Stat Page ============

type BudgetRoundTab = BudgetRound | 'outer';

function BudgetStatPage() {
    const [records] = useState<BudgetRecord[]>(initialBudgetRecords);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detailRecord, setDetailRecord] = useState<BudgetRecord | null>(null);
    const [activeRound, setActiveRound] = useState<BudgetRoundTab>('first');
    const [filters, setFilters] = useState<{ keyword?: string; year?: string }>({ year: `${budgetPlanYear}年` });
    const [selectedOrgKey, setSelectedOrgKey] = useState('group');
    const [includeChildren, setIncludeChildren] = useState(true);
    const [treeSearch, setTreeSearch] = useState('');
    const [treeExpandedKeys, setTreeExpandedKeys] = useState<string[]>(['group']);

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

    const baseFilteredRecords = useMemo(() => {
        const keyword = String(filters.keyword || '').trim().toLowerCase();
        const year = String(filters.year || '').replace('年', '').trim();

        return records.filter((record) => {
            if (keyword) {
                const combined = [record.projectName, record.budgetCode, record.unitName]
                    .join(' ')
                    .toLowerCase();
                if (!combined.includes(keyword)) return false;
            }
            if (year && !record.budgetCode.includes(year)) return false;
            return true;
        });
    }, [records, filters]);

    const filteredRecords = useMemo(() => {
        const isOuterTab = activeRound === 'outer';
        return baseFilteredRecords.filter((record) => {
            if (isOuterTab) {
                return record.tabType === 'outer';
            }
            return record.tabType === 'inner' && record.round === activeRound;
        });
    }, [baseFilteredRecords, activeRound]);

    const roundRecordCount = useCallback((round: BudgetRound) => {
        return baseFilteredRecords.filter((r) => r.tabType === 'inner' && r.round === round).length;
    }, [baseFilteredRecords]);

    const outerRecordCount = useMemo(() => {
        return baseFilteredRecords.filter((r) => r.tabType === 'outer').length;
    }, [baseFilteredRecords]);

    const openDetail = (record: BudgetRecord) => {
        setDetailRecord(record);
        setDrawerOpen(true);
    };

    const handleExport = () => {
        const header = ['预算编号', '项目名称', '单位名称', '预算分类', '建设模式', '建设类型', '项目简述', '启动时间', '预计完成时间', '总额(万元)', '版本号', '审核状态'];
        const rows = filteredRecords.map((record) => [
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
        downloadTextFile(`预算统计-${Date.now()}.csv`, content);
        message.success('已导出预算统计表（CSV 演示版）。');
    };

    const columns: ColumnsType<BudgetRecord> = [
        {
            title: '序号',
            width: 60,
            render: (_, __, index) => index + 1,
        },
        {
            title: '项目名称',
            dataIndex: 'projectName',
            width: 180,
            ellipsis: true,
            fixed: 'left',
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
            title: '总额(万元)',
            dataIndex: 'totalInvestment',
            width: 110,
            render: (val: number) => `¥ ${formatMoney(val)}`,
        },
        {
            title: '版本号',
            dataIndex: 'version',
            width: 80,
        },
        {
            title: '操作',
            width: 80,
            fixed: 'right',
            render: (_, record) => (
                <Button size="small" type="link" onClick={() => openDetail(record)}>
                    详情
                </Button>
            ),
        },
    ];

    const roundLabels: Record<BudgetRound, string> = {
        first: '一上',
        second: '二上',
        third: '三上',
    };

    const tabItems: TabsProps['items'] = [
        ...(['first', 'second', 'third'] as BudgetRound[]).map((round) => ({
            key: round,
            label: `${roundLabels[round]}（${roundRecordCount(round)}）`,
            children: (
                <Table
                    rowKey="id"
                    dataSource={filteredRecords}
                    columns={columns}
                    pagination={{
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条`,
                        defaultPageSize: 10,
                    }}
                    scroll={{ x: 1700 }}
                />
            ),
        })),
        {
            key: 'outer',
            label: `预算外（${outerRecordCount}）`,
            children: (
                <Table
                    rowKey="id"
                    dataSource={filteredRecords}
                    columns={columns}
                    pagination={{
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条`,
                        defaultPageSize: 10,
                    }}
                    scroll={{ x: 1700 }}
                />
            ),
        },
    ];

    return (
        <div className="dmp-page-stack">
            <Row gutter={16}>
                <Col xs={24} lg={5}>
                    <Card className="dmp-card-fill" data-annotation-id="budget-stat-tree">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontWeight: 600, fontSize: 14, lineHeight: '22px' }}>组织树</span>
                            <Checkbox
                                checked={includeChildren}
                                onChange={(e) => setIncludeChildren(e.target.checked)}
                            >
                                包含下级
                            </Checkbox>
                        </div>
                        <Input
                            allowClear
                            placeholder="输入关键字进行过滤"
                            value={treeSearch}
                            onChange={(e) => setTreeSearch(e.target.value)}
                            style={{ marginBottom: 12 }}
                        />
                        <Tree
                            treeData={treeData}
                            expandedKeys={expandedKeys}
                            selectedKeys={normalizeSelectedKeys(selectedOrgKey)}
                            onExpand={handleTreeExpand}
                            onSelect={(keys) => setSelectedOrgKey((keys[0] as string) || 'group')}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={19}>
                    <Card className="dmp-query-card" bordered={false} data-annotation-id="budget-stat-query">
                        <Form
                            layout="inline"
                            className="dmp-query-form"
                            initialValues={{ year: `${budgetPlanYear}年` }}
                            onValuesChange={(_, allValues) => setFilters(allValues)}
                        >
                            <Form.Item name="keyword" label="项目名称">
                                <Input allowClear placeholder="项目名称" style={{ width: 220 }} />
                            </Form.Item>
                            <Form.Item name="year" label="年度">
                                <Select
                                    allowClear
                                    placeholder="请选择年度"
                                    style={{ width: 140 }}
                                    options={Array.from({ length: 5 }, (_, i) => {
                                        const year = budgetPlanYear - i;
                                        return { value: `${year}年`, label: `${year}年` };
                                    })}
                                />
                            </Form.Item>
                            <Form.Item>
                                <Space>
                                    <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                                    <Button onClick={() => setFilters({ year: `${budgetPlanYear}年` })}>重置</Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Card>

                    <Card bordered={false} data-annotation-id="budget-stat-table">
                        <Tabs
                            activeKey={activeRound}
                            onChange={(key) => setActiveRound(key as BudgetRoundTab)}
                            items={tabItems}
                            tabBarExtraContent={
                                <Button icon={<CloudDownloadOutlined />} onClick={handleExport}>
                                    导出
                                </Button>
                            }
                        />
                    </Card>
                </Col>
            </Row>

            <BudgetDetailDrawer
                open={drawerOpen}
                record={detailRecord}
                onClose={() => {
                    setDrawerOpen(false);
                    setDetailRecord(null);
                }}
            />
        </div>
    );
}

export default BudgetStatPage;
