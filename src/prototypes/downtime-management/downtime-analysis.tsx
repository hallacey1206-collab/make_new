import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    DownloadOutlined,
    EyeOutlined,
    PaperClipOutlined,
} from '@ant-design/icons';
import {
    Button,
    Card,
    DatePicker,
    InputNumber,
    Radio,
    Space,
    Table,
    Tabs,
    Tooltip,
    Tree,
    message,
} from 'antd';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { TreeDataNode } from 'antd';
import {
    analysisTabs,
    equipmentTreeData,
    initialStopRecords,
    reliabilityReports,
    timeRangeOptions,
    type StopRecord,
} from './data';

function buildTreeData(): TreeDataNode[] {
    return equipmentTreeData.map((proc) => ({
        key: proc.key,
        title: proc.title,
        children: (proc.children as any[]).map((eq) => ({
            key: eq.key,
            title: eq.title,
            isLeaf: true,
        })),
    }));
}

function getRecordsByKey(key: string): StopRecord[] {
    const proc = equipmentTreeData.find((p) => p.key === key);
    if (proc && proc.children) {
        const codes = (proc.children as any[]).map((c) => c.equipmentCode);
        return initialStopRecords.filter((r) => codes.includes(r.equipmentCode));
    }
    const eqInfo = equipmentTreeData
        .flatMap((p) => (p.children as any[]) || [])
        .find((c) => c.key === key);
    if (eqInfo) {
        return initialStopRecords.filter((r) => r.equipmentCode === eqInfo.equipmentCode);
    }
    return [];
}

// ===== 帕累托分析组件（ECharts） =====
function ParetoChart({ records, dimension, threshold }: { records: StopRecord[]; dimension: 'duration' | 'frequency'; threshold: number }) {
    // 按DCS表面原因描述聚合
    const aggregated = useMemo(() => {
        const map: Record<string, { desc: string; code: string; value: number; count: number }> = {};
        records.forEach((r) => {
            const key = r.dcsReasonDesc;
            if (!map[key]) {
                map[key] = { desc: r.dcsReasonDesc, code: r.dcsReasonCode, value: 0, count: 0 };
            }
            if (dimension === 'duration') {
                map[key].value += r.durationHours;
            } else {
                map[key].value += 1;
            }
            map[key].count += 1;
        });
        const arr = Object.values(map).sort((a, b) => b.value - a.value);
        const total = arr.reduce((sum, item) => sum + item.value, 0);
        let cumulative = 0;
        return arr.map((item) => {
            cumulative += item.value;
            return {
                ...item,
                percentage: total > 0 ? (item.value / total) * 100 : 0,
                cumulativePercentage: total > 0 ? (cumulative / total) * 100 : 0,
            };
        });
    }, [records, dimension]);

    const categories = aggregated.map((a) => a.desc);
    const barValues = aggregated.map((a) => a.value);
    const lineValues = aggregated.map((a) => Number(a.cumulativePercentage.toFixed(1)));

    const chartOption = useMemo(() => ({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
        },
        legend: {
            data: [dimension === 'duration' ? '停机时长(小时)' : '停机频次(次)', '累计占比'],
            top: 0,
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: categories,
            axisLabel: {
                rotate: 30,
                fontSize: 11,
                formatter: (val: string) => val.length > 6 ? val.slice(0, 5) + '..' : val,
            },
        },
        yAxis: [
            {
                type: 'value',
                name: dimension === 'duration' ? '时长(小时)' : '频次(次)',
                position: 'left',
            },
            {
                type: 'value',
                name: '累计占比(%)',
                position: 'right',
                min: 0,
                max: 100,
                axisLabel: { formatter: '{value}%' },
            },
        ],
        series: [
            {
                name: dimension === 'duration' ? '停机时长(小时)' : '停机频次(次)',
                type: 'bar',
                data: barValues,
                barWidth: '40%',
                itemStyle: {
                    color: (params: any) => aggregated[params.dataIndex]?.cumulativePercentage <= threshold ? '#1677ff' : '#85b7ff',
                },
                label: {
                    show: true,
                    position: 'top',
                    fontSize: 11,
                },
            },
            {
                name: '累计占比',
                type: 'line',
                smooth: true,
                data: lineValues,
                yAxisIndex: 1,
                lineStyle: { color: '#fa541c', width: 2 },
                itemStyle: { color: '#fa541c' },
                label: {
                    show: true,
                    position: 'top',
                    formatter: '{c}%',
                    fontSize: 10,
                    color: '#fa541c',
                },
                markLine: {
                    silent: true,
                    symbol: 'none',
                    lineStyle: { color: '#ff4d4f', type: 'dashed', width: 1.5 },
                    label: {
                        formatter: `${threshold}%阈值`,
                        color: '#ff4d4f',
                        fontSize: 11,
                        position: 'insideEndTop',
                        distance: -30,
                    },
                    data: [{ yAxis: threshold }],
                },
            },
        ],
    }), [categories, barValues, lineValues, dimension, aggregated, threshold]);

    return (
        <div>
            <ReactECharts
                option={chartOption}
                style={{ height: 320, width: '100%' }}
            />

            {/* 重要表面原因汇总表 */}
            <Table
                rowKey="desc"
                size="small"
                style={{ marginTop: 16 }}
                pagination={false}
                dataSource={aggregated}
                columns={[
                    { title: '排序', width: 60, render: (_, __, idx) => idx + 1 },
                    { title: '表面原因码', dataIndex: 'code', width: 120 },
                    { title: '表面原因描述', dataIndex: 'desc', ellipsis: true },
                    {
                        title: dimension === 'duration' ? '停机时长(小时)' : '停机频次(次)',
                        dataIndex: 'value',
                        width: 140,
                    },
                    {
                        title: '占比',
                        dataIndex: 'percentage',
                        width: 100,
                        render: (val: number) => `${val.toFixed(1)}%`,
                    },
                    {
                        title: '累计占比',
                        dataIndex: 'cumulativePercentage',
                        width: 100,
                        render: (val: number) => (
                            <span style={{ color: val <= threshold ? '#ff4d4f' : '#666', fontWeight: val <= threshold ? 600 : 400 }}>
                                {val.toFixed(1)}%
                            </span>
                        ),
                    },
                    {
                        title: 'ABC分类',
                        width: 100,
                        render: (_, record: any) => {
                            const cls = record.cumulativePercentage <= threshold ? 'A' : record.cumulativePercentage <= 95 ? 'B' : 'C';
                            const colorMap: Record<string, string> = { A: '#ff4d4f', B: '#faad14', C: '#52c41a' };
                            return <span style={{ color: colorMap[cls], fontWeight: 600 }}>{cls}</span>;
                        },
                    },
                ]}
            />
        </div>
    );
}

// ===== 停机分析主组件 =====
export default function DowntimeAnalysisPage() {
    const [treeData] = useState(buildTreeData);
    const [selectedKey, setSelectedKey] = useState<string>('process-crushing');
    const [activeTab, setActiveTab] = useState('statistics');
    const [timeRange, setTimeRange] = useState('week');
    const [customRange, setCustomRange] = useState<[import('dayjs').Dayjs, import('dayjs').Dayjs] | null>(null);
    const [paretoDimension, setParetoDimension] = useState<'duration' | 'frequency'>('duration');
    const [paretoThreshold, setParetoThreshold] = useState(80);
    const [exporting, setExporting] = useState(false);
    // 汇总表中被点击选中的停机类型列（null 表示未选中，点击同一列取消选中）
    const [selectedStopType, setSelectedStopType] = useState<string | null>(null);
    // 汇总表中鼠标悬浮的停机类型列（null 表示未悬浮），用于整列高亮
    const [hoveredStopType, setHoveredStopType] = useState<string | null>(null);
    // 由工序节点下钻到设备节点时记录来源工序，用于展示返回按钮
    const [parentProcessKey, setParentProcessKey] = useState<string | null>(null);

    const currentRecords = useMemo(() => getRecordsByKey(selectedKey), [selectedKey]);

    // 当前选中的是否为工序节点
    const isProcess = useMemo(() => isProcessKey(selectedKey), [selectedKey]);

    // 工序节点时仅保留停机统计、可靠性报告，若当前 Tab 被过滤则回退到停机统计
    useEffect(() => {
        if (isProcess && activeTab !== 'statistics' && activeTab !== 'reliability') {
            setActiveTab('statistics');
        }
    }, [isProcess, activeTab]);

    // 日期范围回显：自定义时用已选范围，其他选项以昨日为截止日计算区间（不含今天），选择器禁用
    const displayRange = useMemo<[import('dayjs').Dayjs, import('dayjs').Dayjs] | null>(() => {
        if (timeRange === 'custom') {
            return customRange;
        }
        const end = dayjs().subtract(1, 'day');
        const dayMap: Record<string, number> = {
            yesterday: 0,
            week: 6,
            month: 1,
            quarter: 3,
            year: 1,
        };
        switch (timeRange) {
            case 'yesterday':
            case 'week':
                return [end.subtract(dayMap[timeRange], 'day'), end];
            case 'month':
                return [end.subtract(1, 'month'), end];
            case 'quarter':
                return [end.subtract(3, 'month'), end];
            case 'year':
                return [end.subtract(1, 'year'), end];
            default:
                return null;
        }
    }, [timeRange, customRange]);

    // 明细列：工序节点时增加设备列（格式：【设备编码】设备名称），去掉故障分类、表面原因、子类型；
    // 设备节点时去掉子类型列，保留故障分类、表面原因
    const detailColumns: ColumnsType<StopRecord> = [
        { title: '停机开始时间', dataIndex: 'stopStartTime', width: 150 },
        { title: '停机结束时间', dataIndex: 'stopEndTime', width: 150 },
        {
            title: '停机时长(小时)',
            dataIndex: 'durationHours',
            width: 110,
        },
        ...(isProcess
            ? [{
                  title: '设备' as const,
                  width: 180,
                  ellipsis: true,
                  // 设备字段显示为可点击链接，点击跳转到对应的设备节点
                  render: (_: any, record: StopRecord) => (
                      <a
                          onClick={(e) => {
                              e.stopPropagation();
                              const eqKey = findEquipmentKeyByCode(record.equipmentCode);
                              if (eqKey) {
                                  setParentProcessKey(selectedKey);
                                  setSelectedKey(eqKey);
                              }
                          }}
                          style={{ color: '#1677ff' }}
                      >
                          【{record.equipmentCode}】{record.equipmentName}
                      </a>
                  ),
              }]
            : [
                  { title: '故障分类' as const, dataIndex: 'dcsFaultCategory' as const, width: 110 },
                  {
                      title: '表面原因' as const,
                      width: 180,
                      ellipsis: true,
                      render: (_: any, record: StopRecord) => `${record.dcsReasonCode}-${record.dcsReasonDesc}`,
                  },
              ]),
        { title: '停机类型', dataIndex: 'stopType', width: 90, render: (v: string) => v || '-' },
        {
            title: '根本原因',
            width: 280,
            render: (_, record: StopRecord) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.rootCause}</span>
                    {record.rootCauseFile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Tooltip title={record.rootCauseFile}>
                                <span style={{ fontSize: 12, color: '#1677ff', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                    <PaperClipOutlined /> {record.rootCauseFile.length > 10 ? record.rootCauseFile.slice(0, 8) + '...' : record.rootCauseFile}
                                </span>
                            </Tooltip>
                            <Tooltip title="预览">
                                <EyeOutlined style={{ fontSize: 12, color: '#1677ff', cursor: 'pointer' }} />
                            </Tooltip>
                            <Tooltip title="下载">
                                <DownloadOutlined style={{ fontSize: 12, color: '#1677ff', cursor: 'pointer' }} />
                            </Tooltip>
                        </div>
                    )}
                </div>
            ),
        },
        { title: '填报人', dataIndex: 'reporter', width: 90, render: (v: string) => v || '-' },
    ];

    // 汇总：按设备汇总
    const summaryByDevice = useMemo(() => {
        const map: Record<string, { equipmentName: string; equipmentCode: string; count: number; totalHours: number; faultCount: number; planCount: number }> = {};
        currentRecords.forEach((r) => {
            const key = r.equipmentCode;
            if (!map[key]) {
                map[key] = { equipmentName: r.equipmentName, equipmentCode: r.equipmentCode, count: 0, totalHours: 0, faultCount: 0, planCount: 0 };
            }
            map[key].count += 1;
            map[key].totalHours += r.durationHours;
            if (['机械故障', '工艺故障', '电气故障'].includes(r.stopType)) map[key].faultCount += 1;
            if (r.stopType === '计划停机') map[key].planCount += 1;
        });
        return Object.values(map);
    }, [currentRecords]);

    const summaryColumns: ColumnsType<typeof summaryByDevice[0]> = [
        { title: '设备名称', dataIndex: 'equipmentName', width: 140 },
        { title: '设备编码', dataIndex: 'equipmentCode', width: 120 },
        { title: '停机次数', dataIndex: 'count', width: 100 },
        { title: '停机总时长(小时)', dataIndex: 'totalHours', width: 140 },
        { title: '故障停机次数', dataIndex: 'faultCount', width: 120 },
        { title: '计划停机次数', dataIndex: 'planCount', width: 120 },
    ];

    // 明细表数据：点击停机类型列时同步筛选，未选中时展示全部
    const displayRecords = useMemo(
        () => (selectedStopType ? currentRecords.filter((r) => r.stopType === selectedStopType) : currentRecords),
        [currentRecords, selectedStopType]
    );

    // 按停机类型汇总（用于停机统计 Tab 顶部汇总表，停机类型固定五类，不含不计入）
    const summaryByType = useMemo(() => {
        const types = ['机械故障', '工艺故障', '电气故障', '计划停机', '其他'];
        const durationRow: Record<string, number> = {};
        const countRow: Record<string, number> = {};
        types.forEach((t) => { durationRow[t] = 0; countRow[t] = 0; });
        currentRecords.forEach((r) => {
            // 不计入的记录不参与汇总
            if (r.stopType === '不计入') return;
            const type = types.includes(r.stopType) ? r.stopType : '其他';
            durationRow[type] += r.durationHours;
            countRow[type] += 1;
        });
        return [
            { key: 'duration', label: '时间汇总(h)', ...durationRow },
            { key: 'count', label: '次数汇总', ...countRow },
        ];
    }, [currentRecords]);

    // 点击停机类型列头/单元格：选中该类型筛选明细，再次点击取消
    const handleStopTypeClick = (type: string) => {
        setSelectedStopType((prev) => (prev === type ? null : type));
    };

    // 切换设备树节点时，重置汇总表列的选中与悬浮状态
    useEffect(() => {
        setSelectedStopType(null);
        setHoveredStopType(null);
    }, [selectedKey]);

    const summaryByTypeColumns = [
        { title: '停机类型', dataIndex: 'label', width: 100, fixed: 'left' as const },
        ...['机械故障', '工艺故障', '电气故障', '计划停机', '其他'].map((t) => ({
            title: t,
            dataIndex: t,
            width: 100,
            // 整列悬浮/选中高亮：通过 hoveredStopType / selectedStopType 统一控制该列所有单元格样式
            onHeaderCell: () => ({
                className: `dtm-stop-type-col${selectedStopType === t ? ' dtm-stop-type-col-selected' : ''}${hoveredStopType === t && selectedStopType !== t ? ' dtm-stop-type-col-hover' : ''}`,
                onClick: () => handleStopTypeClick(t),
                onMouseEnter: () => setHoveredStopType(t),
                onMouseLeave: () => setHoveredStopType(null),
            }),
            onCell: () => ({
                className: `dtm-stop-type-col${selectedStopType === t ? ' dtm-stop-type-col-selected' : ''}${hoveredStopType === t && selectedStopType !== t ? ' dtm-stop-type-col-hover' : ''}`,
                onClick: () => handleStopTypeClick(t),
                onMouseEnter: () => setHoveredStopType(t),
                onMouseLeave: () => setHoveredStopType(null),
            }),
            render: (v: number, record: any) => (
                <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                    {record.key === 'duration' ? v.toFixed(1) : v}
                </span>
            ),
        })),
    ];

// 是否选中了工序节点（非叶子节点即工序）
function isProcessKey(key: string): boolean {
    return equipmentTreeData.some((p) => p.key === key);
}

// 根据设备编码在设备树中查找对应节点 key
function findEquipmentKeyByCode(equipmentCode: string): string | null {
    for (const proc of equipmentTreeData) {
        const eq = (proc.children as any[])?.find((c) => c.equipmentCode === equipmentCode);
        if (eq) return eq.key as string;
    }
    return null;
}

// 根据选中的树节点获取工序名称和设备名称
// 若选中工序节点，设备显示该工序下被设为工序运行设备的设备（默认取第一个设备作为模拟数据）
    const selectedNodeInfo = useMemo(() => {
        for (const proc of equipmentTreeData) {
            if (proc.key === selectedKey) {
                const primaryEq = (proc.children as any[])?.[0];
                return { processName: proc.title, equipmentName: primaryEq ? primaryEq.title : '-' };
            }
            const eq = (proc.children as any[])?.find((c) => c.key === selectedKey);
            if (eq) {
                return { processName: proc.title, equipmentName: eq.title };
            }
        }
        return { processName: '', equipmentName: '' };
    }, [selectedKey]);

    // 表面原因汇总：按DCS原因描述聚合
    const causeSummary = useMemo(() => {
        const map: Record<string, { desc: string; code: string; category: string; count: number; totalHours: number }> = {};
        currentRecords.forEach((r) => {
            const key = r.dcsReasonDesc;
            if (!map[key]) {
                map[key] = { desc: r.dcsReasonDesc, code: r.dcsReasonCode, category: r.dcsFaultCategory, count: 0, totalHours: 0 };
            }
            map[key].count += 1;
            map[key].totalHours += r.durationHours;
        });
        return Object.values(map).sort((a, b) => b.totalHours - a.totalHours);
    }, [currentRecords]);

    // 表面原因汇总合计数据
    const causeSummaryTotal = useMemo(() => {
        const count = causeSummary.reduce((s, i) => s + i.count, 0);
        const totalHours = causeSummary.reduce((s, i) => s + i.totalHours, 0);
        return { count, totalHours };
    }, [causeSummary]);

    const causeSummaryColumns: ColumnsType<typeof causeSummary[0]> = [
        { title: 'DCS故障分类', dataIndex: 'category', width: 120 },
        { title: 'DCS表面原因码', dataIndex: 'code', width: 120 },
        { title: 'DCS表面原因描述', dataIndex: 'desc', ellipsis: true },
        { title: '停机次数', dataIndex: 'count', width: 100 },
        { title: '停机总时长(小时)', dataIndex: 'totalHours', width: 140 },
        {
            title: '占比',
            width: 100,
            render: (_, record: any) => {
                const total = causeSummary.reduce((s, i) => s + i.totalHours, 0);
                return total > 0 ? `${((record.totalHours / total) * 100).toFixed(1)}%` : '-';
            },
        },
    ];

    return (
        <div className="dtm-page-stack">
            <div className="dtm-tree-table-layout">
                {/* 左侧设备树 */}
                <Card className="dtm-tree-panel" title="设备树" size="small" data-annotation-id="da-tree">
                    <Tree
                        defaultExpandAll
                        selectedKeys={[selectedKey]}
                        onSelect={(keys) => {
                            // 点击已选中节点时 antd 会取消选中，保持选中不变
                            if (keys.length > 0) {
                                setParentProcessKey(null);
                                setSelectedKey(String(keys[0]));
                            }
                        }}
                        treeData={treeData}
                    />
                </Card>

                {/* 右侧内容 */}
                <div className="dtm-table-panel">
                    <Card
                        bordered={false}
                        extra={
                            <Space data-annotation-id="da-time-range">
                                <Radio.Group
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    optionType="button"
                                    buttonStyle="solid"
                                    size="small"
                                    options={timeRangeOptions}
                                />
                                <DatePicker.RangePicker
                                    size="small"
                                    disabled={timeRange !== 'custom'}
                                    value={displayRange}
                                    onChange={(dates) => setCustomRange(dates as [import('dayjs').Dayjs, import('dayjs').Dayjs] | null)}
                                />
                            </Space>
                        }
                    >
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            tabBarExtraContent={
                                !isProcess && parentProcessKey
                                    ? {
                                          right: (
                                              <Button
                                                  size="small"
                                                  icon={<ArrowLeftOutlined />}
                                                  onClick={() => {
                                                      setSelectedKey(parentProcessKey);
                                                      setParentProcessKey(null);
                                                  }}
                                              >
                                                  返回
                                              </Button>
                                          ),
                                      }
                                    : undefined
                            }
                            items={analysisTabs
                                // 工序节点时只展示停机统计、可靠性报告两个 Tab
                                .filter((tab) =>
                                    isProcess ? ['statistics', 'reliability'].includes(tab.key) : true
                                )
                                .map((tab) => ({
                                key: tab.key,
                                label: tab.label,
                                children: (
                                    <>
                                        {tab.key === 'statistics' && (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }} data-annotation-id="da-statistics-header">
                                                    <Space size="large">
                                                        <span><b>产线工序：</b>{selectedNodeInfo.processName || '-'}</span>
                                                        {/* 工序节点时设备字段不显示，仅设备节点展示 */}
                                                        {!isProcess && <span><b>设备：</b>{selectedNodeInfo.equipmentName || '-'}</span>}
                                                    </Space>
                                                    <Button
                                                        size="small"
                                                        icon={<DownloadOutlined />}
                                                        loading={exporting}
                                                        onClick={() => {
                                                            setExporting(true);
                                                            message.loading('正在导出', 0);
                                                            setTimeout(() => {
                                                                setExporting(false);
                                                                message.destroy();
                                                                message.success('导出成功');
                                                            }, 1500);
                                                        }}
                                                    >
                                                        导出
                                                    </Button>
                                                </div>
                                                <Table
                                                    rowKey="key"
                                                    size="small"
                                                    style={{ marginBottom: 16 }}
                                                    dataSource={summaryByType}
                                                    columns={summaryByTypeColumns}
                                                    pagination={false}
                                                    data-annotation-id="da-summary-table"
                                                />
                                                <Table
                                                    rowKey="id"
                                                    size="small"
                                                    dataSource={displayRecords}
                                                    columns={detailColumns}
                                                    pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
                                                    scroll={{ x: 'max-content' }}
                                                    data-annotation-id="da-detail-table"
                                                />
                                            </>
                                        )}
                                        {tab.key === 'cause-summary' && (
                                            <Table
                                                rowKey="desc"
                                                size="small"
                                                dataSource={causeSummary}
                                                columns={causeSummaryColumns}
                                                pagination={false}
                                                data-annotation-id="da-cause-summary"
                                                summary={() => (
                                                    <Table.Summary fixed>
                                                        <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 600 }}>
                                                            <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                                                            <Table.Summary.Cell index={1} colSpan={2}>
                                                                共 {causeSummary.length} 类表面原因
                                                            </Table.Summary.Cell>
                                                            <Table.Summary.Cell index={3}>
                                                                {causeSummaryTotal.count}
                                                            </Table.Summary.Cell>
                                                            <Table.Summary.Cell index={4}>
                                                                {causeSummaryTotal.totalHours.toFixed(1)}
                                                            </Table.Summary.Cell>
                                                            <Table.Summary.Cell index={5}>100.0%</Table.Summary.Cell>
                                                        </Table.Summary.Row>
                                                    </Table.Summary>
                                                )}
                                            />
                                        )}
                                        {tab.key === 'reliability' && (
                                            <div className="dtm-reliability-grid" data-annotation-id="da-reliability">
                                                {reliabilityReports.map((rpt, idx) => (
                                                    <div key={idx} className="dtm-reliability-card">
                                                        <div className="dtm-rel-name">{rpt.name}</div>
                                                        <div className="dtm-rel-value">{rpt.value}</div>
                                                        <div className="dtm-rel-formula">{rpt.formula}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {tab.key === 'pareto' && (
                                            <div data-annotation-id="da-pareto">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                    <Radio.Group
                                                        value={paretoDimension}
                                                        onChange={(e) => setParetoDimension(e.target.value)}
                                                        optionType="button"
                                                        buttonStyle="solid"
                                                        size="small"
                                                        options={[
                                                            { value: 'duration', label: '按停机时长' },
                                                            { value: 'frequency', label: '按停机频次' },
                                                        ]}
                                                    />
                                                    <Space>
                                                        <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>重要原因影响比例:</span>
                                                        <InputNumber
                                                            size="small"
                                                            min={1}
                                                            max={100}
                                                            value={paretoThreshold}
                                                            onChange={(v) => setParetoThreshold(v ?? 80)}
                                                            style={{ width: 80 }}
                                                            formatter={(v) => `${v}`}
                                                            parser={(v) => Number(v?.replace(/[^0-9]/g, '')) || 0}
                                                            addonAfter="%"
                                                        />
                                                    </Space>
                                                </div>
                                                <ParetoChart records={currentRecords} dimension={paretoDimension} threshold={paretoThreshold} />
                                            </div>
                                        )}
                                    </>
                                ),
                            }))}
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
}
