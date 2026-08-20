import React, { useCallback, useMemo, useState } from 'react';
import type { TabsProps } from 'antd';
import {
    CloudDownloadOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import {
    Button,
    Card,
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
    type BudgetRecord,
    type BudgetStatus,
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

// ============ Budget View Page ============

type BudgetRoundTab = BudgetRound | 'outer';

function BudgetViewPage() {
    const [records] = useState<BudgetRecord[]>(initialBudgetRecords);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detailRecord, setDetailRecord] = useState<BudgetRecord | null>(null);
    const [activeRound, setActiveRound] = useState<BudgetRoundTab>('first');
    const [filters, setFilters] = useState<{ keyword?: string; year?: string }>({ year: `${budgetPlanYear}年` });

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
        downloadTextFile(`本年度数字化预算表-${Date.now()}.csv`, content);
        message.success('已导出预算表（CSV 演示版）。');
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
            title: '审核状态',
            dataIndex: 'status',
            width: 90,
            fixed: 'right',
            render: (status: BudgetStatus) => (
                <Tag color={getBudgetStatusColor(status)}>{getBudgetStatusLabel(status)}</Tag>
            ),
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
            <Card className="dmp-query-card" bordered={false} data-annotation-id="budget-view-query">
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

            <Card bordered={false} data-annotation-id="budget-view-table">
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

export default BudgetViewPage;
