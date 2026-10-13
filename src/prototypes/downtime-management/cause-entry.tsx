import React, { useMemo, useState } from 'react';
import {
    DeleteOutlined,
    DownOutlined,
    EditOutlined,
    LineChartOutlined,
    PaperClipOutlined,
    PlusOutlined,
    RightOutlined,
    SearchOutlined,
    UploadOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {
    AutoComplete,
    Button,
    Card,
    Checkbox,
    Col,
    DatePicker,
    Drawer,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Table,
    Tree,
    TreeSelect,
    Upload,
    message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TreeDataNode } from 'antd';
import dayjs from 'dayjs';
import {
    dcsFaultCategoryOptions,
    equipmentTreeData,
    initialDcsReasons,
    initialStopRecords,
    reporterOptions,
    stopTypeOptions,
    type StopRecord,
} from './data';

const { RangePicker } = DatePicker;

// 人员组织架构树（模拟，人员为叶子节点）
const personTreeData = [
    {
        key: 'org-root',
        title: 'DCC生产运维工厂',
        children: [
            { key: 'org-lzbc', title: '兰州宝城工程技术有限公司', isLeaf: true },
            { key: 'org-sk', title: '数科部门临时使用', isLeaf: true },
            {
                key: 'org-sc',
                title: '生产部',
                children: [
                    {
                        key: 'org-lzb',
                        title: '兰州宝城',
                        children: [
                            ...reporterOptions.map((r) => ({ key: r.value, title: r.value, isLeaf: true, isPerson: true })),
                        ],
                    },
                ],
            },
        ],
    },
];

// 展开所有包含人员的节点 key
const personOrgKeys = ['org-root', 'org-sc', 'org-lzb'];

// 趋势图变量数据（模拟）
const trendVariables = [
    {
        name: '运行信号',
        color: '#52c41a',
        data: Array.from({ length: 30 }, (_, i) => {
            const t = i / 29;
            return t > 0.35 && t < 0.55 ? 5 : 88;
        }),
    },
    {
        name: '主电机电流(A)',
        color: '#1677ff',
        data: Array.from({ length: 30 }, (_, i) => {
            const t = i / 29;
            if (t > 0.35 && t < 0.55) return 12 + Math.sin(i * 0.5) * 3;
            return 62 + Math.sin(i * 0.4) * 18;
        }),
    },
    {
        name: '轴承温度(°C)',
        color: '#fa8c16',
        data: Array.from({ length: 30 }, (_, i) => {
            const t = i / 29;
            if (t > 0.35 && t < 0.55) return 42 + (i - 10) * 0.4;
            return 70 + Math.sin(i * 0.3) * 8;
        }),
    },
];

function genTrendPath(data: number[]): string {
    const W = 660, P = 60, T = 20, H = 260;
    return data
        .map((v, i) => {
            const x = P + (i / (data.length - 1)) * W;
            const y = T + (1 - Math.max(0, Math.min(100, v)) / 100) * H;
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
}

// 将设备树数据转为 antd Tree 格式
function buildTreeData(): TreeDataNode[] {
    return equipmentTreeData.map((proc) => ({
        key: proc.key,
        title: proc.title,
        children: (proc.children as any[]).map((eq) => ({
            key: eq.key,
            title: <span>{eq.title}</span>,
            isLeaf: true,
        })),
    }));
}

// 树形下拉搜索：匹配工序/设备名称或设备编码；工序命中时保留其下设备
function filterEquipmentTreeNode(input: string, node: any): boolean {
    const keyword = (input || '').trim().toLowerCase();
    if (!keyword) return false;
    const title = String(node?.title ?? '').toLowerCase();
    const value = String(node?.value ?? '').toLowerCase();
    if (title.includes(keyword) || value.includes(keyword)) return true;
    return (node?.children || []).some((child: any) => filterEquipmentTreeNode(input, child));
}

// 根据选中的节点 key 从传入的记录列表中获取关联记录
function getRecordsByKey(key: string, source: StopRecord[]): StopRecord[] {
    const proc = equipmentTreeData.find((p) => p.key === key);
    if (proc && proc.children) {
        const codes = (proc.children as any[]).map((c) => c.equipmentCode);
        // 设备编码为空的记录属于工序级停机，仅在工序节点下显示
        return source.filter((r) => !r.equipmentCode || codes.includes(r.equipmentCode));
    }
    const eqInfo = equipmentTreeData
        .flatMap((p) => (p.children as any[]) || [])
        .find((c) => c.key === key);
    if (eqInfo) {
        return source.filter((r) => r.equipmentCode === eqInfo.equipmentCode);
    }
    return [];
}

// 默认查询时间范围：前一天 00:00:00 ~ 23:59:59
function getDefaultDateRange(): [dayjs.Dayjs, dayjs.Dayjs] {
    const yesterday = dayjs().subtract(1, 'day');
    return [
        yesterday.startOf('day'),
        yesterday.startOf('day').add(23, 'hour').add(59, 'minute').add(59, 'second'),
    ];
}

export default function CauseEntryPage() {
    const [treeData] = useState(buildTreeData);
    const [selectedKey, setSelectedKey] = useState<string>('process-crushing');
    const [records, setRecords] = useState<StopRecord[]>(initialStopRecords);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(
        getDefaultDateRange
    );
    const [treeSearch, setTreeSearch] = useState('');
    const [trendModalOpen, setTrendModalOpen] = useState(false);
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(equipmentTreeData.map((p) => p.key));

    // 人员选择弹窗状态
    const [personModalOpen, setPersonModalOpen] = useState(false);
    const [personModalTarget, setPersonModalTarget] = useState<{ type: 'inline' | 'drawer'; recordId?: string } | null>(null);
    const [personSearch, setPersonSearch] = useState('');
    const [tempSelectedPerson, setTempSelectedPerson] = useState<string>('');
    const [expandedOrgKeys, setExpandedOrgKeys] = useState<React.Key[]>(personOrgKeys);

    // 统计经常选择的人员（按频次排序，取前3）
    const frequentReporters = useMemo(() => {
        const countMap: Record<string, number> = {};
        records.forEach((r) => {
            if (r.reporter) countMap[r.reporter] = (countMap[r.reporter] || 0) + 1;
        });
        return Object.entries(countMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name);
    }, [records]);

    // 从已有记录中提取不重复的根本原因，用于自动匹配推荐
    const rootCauseHistory = useMemo(() => {
        const set = new Set<string>();
        records.forEach((r) => {
            if (r.rootCause) set.add(r.rootCause);
        });
        return Array.from(set).map((v) => ({ value: v, label: v }));
    }, [records]);

    const currentRecords = useMemo(() => {
        let result = getRecordsByKey(selectedKey, records);
        // 工序停机记录（无设备编码或标记为工序级）在前，设备停机记录在后
        result = [...result].sort((a, b) => {
            const aProc = !a.equipmentCode || !!a.isProcessRecord;
            const bProc = !b.equipmentCode || !!b.isProcessRecord;
            return aProc === bProc ? 0 : aProc ? -1 : 1;
        });
        if (dateRange && dateRange[0] && dateRange[1]) {
            const start = dateRange[0].format('YYYY-MM-DD HH:mm:ss');
            const end = dateRange[1].format('YYYY-MM-DD HH:mm:ss');
            result = result.filter((r) => r.stopStartTime >= start && r.stopStartTime <= end);
        }
        return result;
    }, [selectedKey, dateRange, records]);

    // 趋势图 X 轴刻度：按所选时间范围均分展示
    const trendXLabels = useMemo(() => {
        const [start, end] = dateRange || [];
        if (start && end && end.valueOf() >= start.valueOf()) {
            const total = end.valueOf() - start.valueOf();
            return Array.from({ length: 7 }, (_, i) =>
                start
                    .add((total * i) / 6, 'ms')
                    .format(total > 24 * 60 * 60 * 1000 ? 'MM-DD HH:mm' : 'HH:mm:ss')
            );
        }
        return ['开始', '', '', '', '', '', '结束'];
    }, [dateRange]);

    // 是否选中了工序节点
    const isProcessSelected = useMemo(() => {
        return equipmentTreeData.some((p) => p.key === selectedKey);
    }, [selectedKey]);

    // 工序-设备树形下拉数据源（按工序-设备层级展示）
    const equipmentTreeSelectData = useMemo(() => {
        return equipmentTreeData.map((proc) => ({
            value: proc.key,
            title: proc.title,
            selectable: false,
            children: ((proc.children as any[]) || []).map((eq) => ({
                value: eq.equipmentCode,
                title: eq.title,
            })),
        }));
    }, []);

    // 搜索过滤后的设备树
    const filteredTreeData = useMemo(() => {
        const kw = treeSearch.trim().toLowerCase();
        if (!kw) return treeData;
        const result: TreeDataNode[] = [];
        for (const proc of equipmentTreeData) {
            const procTitle = (proc.title as string).toLowerCase();
            const matchedChildren = (proc.children || []).filter(
                (eq: any) => (eq.title as string).toLowerCase().includes(kw)
            );
            if (procTitle.includes(kw)) {
                const procNode = treeData.find((n) => n.key === proc.key);
                if (procNode) result.push(procNode);
            } else if (matchedChildren.length > 0) {
                const procNode = treeData.find((n) => n.key === proc.key);
                if (procNode) {
                    result.push({
                        ...procNode,
                        children: (procNode.children || []).filter((c: any) =>
                            matchedChildren.some((m) => m.key === c.key)
                        ),
                    });
                }
            }
        }
        return result;
    }, [treeData, treeSearch]);

    // 搜索时自动展开匹配节点
    const filteredExpandedKeys = useMemo(() => {
        if (!treeSearch.trim()) return expandedKeys;
        return filteredTreeData.map((n) => n.key);
    }, [filteredTreeData, treeSearch, expandedKeys]);

    const handleSelect = (keys: React.Key[]) => {
        if (keys.length > 0) {
            setSelectedKey(String(keys[0]));
        }
    };

    // 实时保存：字段变更时直接写入 records
    const updateField = (id: string, field: string, value: string) => {
        setRecords((prev) =>
            prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
        );
    };

    const handleRemoveFile = (id: string) => {
        updateField(id, 'rootCauseFile', '');
        message.success('附件已删除。');
    };

    // 打开人员选择弹窗
    const openPersonModal = (type: 'inline' | 'drawer', recordId?: string, currentValue?: string) => {
        setPersonModalTarget({ type, recordId });
        setTempSelectedPerson(currentValue || '');
        setPersonSearch('');
        setExpandedOrgKeys(personOrgKeys);
        setPersonModalOpen(true);
    };

    // 确认人员选择
    const confirmPersonSelect = () => {
        if (personModalTarget) {
            if (personModalTarget.type === 'inline' && personModalTarget.recordId) {
                updateField(personModalTarget.recordId, 'reporter', tempSelectedPerson);
            } else if (personModalTarget.type === 'drawer') {
                form.setFieldValue('reporter', tempSelectedPerson || undefined);
            }
        }
        setPersonModalOpen(false);
    };

    // 搜索过滤后的组织树（仅保留匹配人员及其上级组织）
    const filteredPersonTree = useMemo(() => {
        const keyword = personSearch.trim().toLowerCase();
        if (!keyword) return personTreeData;
        const filterNodes = (nodes: any[]): any[] => {
            const result: any[] = [];
            nodes.forEach((n) => {
                if (n.isPerson) {
                    if ((n.title as string).toLowerCase().includes(keyword)) result.push(n);
                } else if (n.children) {
                    const children = filterNodes(n.children);
                    if (children.length > 0 || (n.title as string).toLowerCase().includes(keyword)) {
                        result.push({ ...n, children });
                    }
                } else if ((n.title as string).toLowerCase().includes(keyword)) {
                    result.push(n);
                }
            });
            return result;
        };
        return filterNodes(personTreeData);
    }, [personSearch]);

    // 渲染组织树：组织节点带展开/收起箭头，人员叶子节点带复选框（单选）
    const renderPersonTreeNodes = (nodes: any[], level: number): React.ReactNode =>
        nodes.map((node: any) => {
            if (node.isPerson) {
                const checked = tempSelectedPerson === node.key;
                return (
                    <div
                        key={node.key}
                        onClick={() => setTempSelectedPerson(checked ? '' : node.key)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            height: 32,
                            paddingLeft: level * 20 + 16,
                            paddingRight: 8,
                            fontSize: 14,
                            cursor: 'pointer',
                            borderRadius: 4,
                            background: checked ? '#f0f5ff' : undefined,
                            color: checked ? '#1677ff' : 'rgba(0,0,0,0.88)',
                        }}
                    >
                        <Checkbox
                            checked={checked}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => setTempSelectedPerson(checked ? '' : node.key)}
                        />
                        <span>{node.title}</span>
                    </div>
                );
            }
            const expanded = !!personSearch.trim() || expandedOrgKeys.includes(node.key);
            return (
                <div key={node.key}>
                    <div
                        onClick={() => {
                            if (!personSearch.trim()) {
                                setExpandedOrgKeys((prev) =>
                                    prev.includes(node.key)
                                        ? prev.filter((k) => k !== node.key)
                                        : [...prev, node.key]
                                );
                            }
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            height: 32,
                            paddingLeft: level * 20,
                            fontSize: 14,
                            color: 'rgba(0,0,0,0.88)',
                            cursor: 'pointer',
                            borderRadius: 4,
                        }}
                    >
                        {expanded ? (
                            <DownOutlined style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)' }} />
                        ) : (
                            <RightOutlined style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)' }} />
                        )}
                        <span>{node.title}</span>
                    </div>
                    {node.children && expanded && renderPersonTreeNodes(node.children, level + 1)}
                </div>
            );
        });

    // ---- 新增/编辑抽屉 ----
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    // 抽屉表单模式：工序停机记录 / 设备停机记录（打开时按已选树节点快照）
    const [drawerFormMode, setDrawerFormMode] = useState<'process' | 'equipment'>('process');
    // 正在编辑的记录是否为「工序停机记录」（与列表设备列约束一致：设备禁用但有数据）
    const [editingIsProcessRecord, setEditingIsProcessRecord] = useState(false);
    const [form] = Form.useForm();
    const [formProcessKey, setFormProcessKey] = useState<string>('');
    const watchStartTime = Form.useWatch('stopStartTime', form);
    const watchEndTime = Form.useWatch('stopEndTime', form);

    // 自动计算停机时长（小时）
    const computedDuration = useMemo(() => {
        if (watchStartTime && watchEndTime) {
            const diff = watchEndTime.diff(watchStartTime, 'hour', true);
            return diff > 0 ? Math.round(diff * 10) / 10 : 0;
        }
        return 0;
    }, [watchStartTime, watchEndTime]);

    const processOptions = useMemo(
        () => equipmentTreeData.map((proc) => ({ value: proc.key, label: proc.title })),
        []
    );

    const formEquipmentOptions = useMemo(() => {
        if (!formProcessKey) return [];
        const proc = equipmentTreeData.find((p) => p.key === formProcessKey);
        if (!proc || !proc.children) return [];
        return (proc.children as any[]).map((eq) => ({
            value: eq.equipmentCode,
            label: eq.title,
            equipmentName: eq.title.split('】')[1] || eq.title,
            processUnit: eq.processName,
        }));
    }, [formProcessKey]);

    const dcsReasonOptions = useMemo(
        () => initialDcsReasons.map((r) => ({
            value: r.dcsReasonCode,
            label: `${r.dcsReasonCode}-${r.dcsReasonDesc}`,
        })),
        []
    );

    // 当前选中的设备节点信息（含所属工序，仅设备节点时非空）
    const selectedEqInfo = useMemo(() => {
        for (const proc of equipmentTreeData) {
            const eq = ((proc.children as any[]) || []).find((c) => c.key === selectedKey);
            if (eq) return { ...(eq as any), procKey: proc.key };
        }
        return null;
    }, [selectedKey]);

    const handleAdd = () => {
        setEditingId(null);
        setEditingIsProcessRecord(false);
        form.resetFields();
        // 按已选树节点加载不同表单并预填充（预填充字段不可编辑）
        if (isProcessSelected) {
            // 工序停机记录表单：产线工序预填充且禁用，设备待选择
            setDrawerFormMode('process');
            setFormProcessKey(selectedKey);
            form.setFieldsValue({ processKey: selectedKey });
        } else {
            // 设备停机记录表单：产线工序与设备均预填充且禁用
            setDrawerFormMode('equipment');
            setFormProcessKey(selectedEqInfo?.procKey || '');
            form.setFieldsValue({
                processKey: selectedEqInfo?.procKey,
                equipmentCode: selectedEqInfo?.equipmentCode,
            });
        }
        setDrawerOpen(true);
    };

    const handleEdit = (record: StopRecord) => {
        setEditingId(record.id);
        setEditingIsProcessRecord(!!record.isProcessRecord);
        // 编辑时按记录本身类型决定抽屉模式：有设备编码且不是工序停机记录 → 设备停机记录；否则 → 工序停机记录
        const isEquipmentRecord = !!record.equipmentCode && !record.isProcessRecord;
        setDrawerFormMode(isEquipmentRecord ? 'equipment' : 'process');
        const proc = record.equipmentCode
            ? equipmentTreeData.find((p) =>
                  (p.children as any[]).some((c) => c.equipmentCode === record.equipmentCode)
              )
            : equipmentTreeData.find((p) => p.key === formProcessKey);
        setFormProcessKey(proc?.key || '');
        form.setFieldsValue({
            processKey: proc?.key || undefined,
            equipmentCode: record.equipmentCode,
            stopStartTime: dayjs(record.stopStartTime),
            stopEndTime: dayjs(record.stopEndTime),
            dcsFaultCategory: record.dcsFaultCategory,
            dcsReasonCode: record.dcsReasonCode,
            stopType: record.stopType || undefined,
            rootCause: record.rootCause,
            rootCauseFile: record.rootCauseFile || undefined,
            reporter: record.reporter || undefined,
        });
        setDrawerOpen(true);
    };

    const handleDrawerSubmit = () => {
        form.validateFields().then((values) => {
            // 设备编码为空时表示工序级停机（未指定具体设备）
            const eqInfo = formEquipmentOptions.find((e) => e.value === values.equipmentCode);
            const formProc = equipmentTreeData.find((p) => p.key === values.processKey);
            const reasonInfo = initialDcsReasons.find((r) => r.dcsReasonCode === values.dcsReasonCode);
            const record: StopRecord = {
                id: editingId || `sr-${Date.now()}`,
                processUnit: eqInfo?.processUnit || (formProc?.title as string) || '',
                equipmentName: eqInfo?.equipmentName || '',
                equipmentCode: values.equipmentCode || '',
                stopStartTime: values.stopStartTime.format('YYYY-MM-DD HH:mm:ss'),
                stopEndTime: values.stopEndTime.format('YYYY-MM-DD HH:mm:ss'),
                dcsFaultCategory: values.dcsFaultCategory || '',
                dcsReasonCode: values.dcsReasonCode || '',
                dcsReasonDesc: reasonInfo?.dcsReasonDesc || '',
                stopType: values.stopType || '',
                subType: values.subType || '',
                rootCause: values.rootCause || '',
                rootCauseFile: values.rootCauseFile || (editingId
                    ? records.find((r) => r.id === editingId)?.rootCauseFile || ''
                    : ''),
                durationHours: computedDuration,
                reporter: values.reporter || '',
            };
            if (editingId) {
                setRecords((prev) => prev.map((r) => (r.id === editingId ? record : r)));
                message.success('修改成功');
            } else {
                setRecords((prev) => [...prev, record]);
                message.success('新增成功');
            }
            setDrawerOpen(false);
        });
    };

    // 设备内联更新
    const updateEquipment = (id: string, equipmentCode: string) => {
        const proc = equipmentTreeData.find((p) =>
            (p.children as any[]).some((c) => c.equipmentCode === equipmentCode)
        );
        const eqInfo = (proc?.children as any[] || []).find((c) => c.equipmentCode === equipmentCode);
        if (eqInfo) {
            setRecords((prev) =>
                prev.map((r) => r.id === id ? {
                    ...r,
                    equipmentCode,
                    equipmentName: eqInfo.title.split('】')[1] || eqInfo.title,
                    processUnit: eqInfo.processName,
                } : r)
            );
        }
    };

    const columns: ColumnsType<StopRecord> = [
        {
            title: '产线工序',
            dataIndex: 'processUnit',
            width: 100,
            ellipsis: true,
            render: (_: any, record: StopRecord) => {
                // 选中工序节点时，工序名称与选中节点保持一致
                if (isProcessSelected) {
                    const proc = equipmentTreeData.find((p) => p.key === selectedKey);
                    return proc ? proc.title : record.processUnit;
                }
                return record.processUnit;
            },
        },
        {
            title: '设备',
            width: 160,
            ellipsis: true,
            render: (_, record) => {
                // 工序级停机记录：设备下拉框有数据但锁定为禁用
                if (record.isProcessRecord) {
                    return (
                        <TreeSelect
                            size="small"
                            style={{ width: '100%' }}
                            value={record.equipmentCode || undefined}
                            disabled
                            placeholder="选择设备"
                            treeData={equipmentTreeSelectData}
                            treeDefaultExpandAll
                            allowClear
                            showSearch
                            treeNodeFilterProp="title"
                            filterTreeNode={(input, node) =>
                                filterEquipmentTreeNode(input, node)
                            }
                        />
                    );
                }
                // 仅工序级停机记录（无设备编码）可在工序节点下指定设备；设备停机记录不可编辑
                if (isProcessSelected && !record.equipmentCode) {
                    return (
                        <TreeSelect
                            size="small"
                            style={{ width: '100%' }}
                            value={record.equipmentCode || undefined}
                            placeholder="选择设备"
                            treeData={equipmentTreeSelectData}
                            treeDefaultExpandAll
                            allowClear
                            showSearch
                            treeNodeFilterProp="title"
                            filterTreeNode={(input, node) =>
                                filterEquipmentTreeNode(input, node)
                            }
                            onChange={(v) => updateEquipment(record.id, v)}
                        />
                    );
                }
                return `【${record.equipmentCode}】${record.equipmentName}`;
            },
        },
        { title: '停机开始时间', dataIndex: 'stopStartTime', width: 150 },
        { title: '停机结束时间', dataIndex: 'stopEndTime', width: 150 },
        {
            title: '停机时长（小时）',
            width: 130,
            render: (_, record) => {
                const start = dayjs(record.stopStartTime);
                const end = dayjs(record.stopEndTime);
                const diff = end.diff(start, 'hour', true);
                return (diff > 0 ? Math.round(diff * 10) / 10 : 0).toFixed(1);
            },
        },
        {
            title: '故障分类' as const,
            dataIndex: 'dcsFaultCategory' as const,
            width: 110,
            render: (val: string) => (val ? val : '-'),
        },
        {
            title: '表面原因' as const,
            width: 180,
            ellipsis: true,
            render: (_: any, record: StopRecord) =>
                (record.dcsReasonCode || record.dcsReasonDesc)
                    ? `${record.dcsReasonCode}-${record.dcsReasonDesc}`
                    : '-',
        },
        {
            title: '停机类型',
            dataIndex: 'stopType',
            width: 130,
            fixed: 'right' as const,
            render: (val: string, record: StopRecord) => (
                <Select
                    size="small"
                    style={{ width: 110 }}
                    value={val || undefined}
                    placeholder="选择"
                    allowClear
                    options={stopTypeOptions}
                    onChange={(v) => {
                        updateField(record.id, 'stopType', v || '');
                    }}
                />
            ),
        },
        {
            title: '根本原因',
            width: 280,
            fixed: 'right' as const,
            render: (_, record: StopRecord) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <AutoComplete
                        size="small"
                        value={record.rootCause}
                        options={rootCauseHistory}
                        filterOption={(input, option) =>
                            (option?.value as string).toLowerCase().includes(input.toLowerCase())
                        }
                        onChange={(v) => updateField(record.id, 'rootCause', v)}
                        style={{ width: '100%' }}
                    >
                        <Input.TextArea
                            rows={1}
                            placeholder="输入根本原因"
                            style={{ minWidth: 0 }}
                        />
                    </AutoComplete>
                    {record.rootCauseFile ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 12, color: '#1677ff', whiteSpace: 'nowrap' }}>
                                <PaperClipOutlined /> {record.rootCauseFile.length > 10 ? record.rootCauseFile.slice(0, 8) + '...' : record.rootCauseFile}
                            </span>
                            <Button
                                size="small"
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                                style={{ padding: 0 }}
                                onClick={() => handleRemoveFile(record.id)}
                            />
                        </div>
                    ) : (
                        <Upload
                            beforeUpload={(file) => {
                                updateField(record.id, 'rootCauseFile', file.name);
                                message.success('附件已上传。');
                                return false;
                            }}
                            showUploadList={false}
                        >
                            <Button
                                size="small"
                                type="link"
                                icon={<UploadOutlined />}
                                style={{ alignSelf: 'flex-start', padding: 0 }}
                            />
                        </Upload>
                    )}
                </div>
            ),
        },
        {
            title: '填报人',
            dataIndex: 'reporter',
            width: 120,
            fixed: 'right' as const,
            render: (val: string, record: StopRecord) => (
                <Input
                    size="small"
                    readOnly
                    value={val || ''}
                    placeholder="选择"
                    suffix={<UserOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />}
                    onClick={() => openPersonModal('inline', record.id, val)}
                    style={{ cursor: 'pointer', width: 100 }}
                />
            ),
        },
        {
            title: '操作',
            width: 70,
            fixed: 'right' as const,
            render: (_, record: StopRecord) => (
                <Button
                    size="small"
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                >
                    编辑
                </Button>
            ),
        },
    ];

    // 列定义：工序与设备节点共用同一套列（含故障分类/表面原因）
    const dynamicColumns = useMemo(() => columns, [columns]);

    return (
        <div className="dtm-page-stack">
            <div className="dtm-tree-table-layout">
                {/* 左侧设备树 */}
                <Card className="dtm-tree-panel" title="设备树" size="small" data-annotation-id="ce-tree">
                    <Input
                        allowClear
                        prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />}
                        placeholder="搜索工序或设备"
                        value={treeSearch}
                        onChange={(e) => setTreeSearch(e.target.value)}
                        style={{ marginBottom: 8 }}
                    />
                    <Tree
                        defaultExpandAll
                        defaultSelectedKeys={['process-crushing']}
                        treeData={filteredTreeData}
                        selectedKeys={[selectedKey]}
                        expandedKeys={filteredExpandedKeys}
                        onExpand={(keys) => setExpandedKeys(keys)}
                        onSelect={handleSelect}
                    />
                </Card>

                {/* 右侧表格 */}
                <div className="dtm-table-panel">
                    {/* 时间范围查询 */}
                    <div style={{ marginBottom: 12 }} data-annotation-id="ce-date-query">
                        <Space>
                            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>停机开始时间：</span>
                            <RangePicker
                                showTime
                                format="YYYY-MM-DD HH:mm:ss"
                                value={dateRange as any}
                                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
                                placeholder={['开始时间', '结束时间']}
                            />
                            <Button type="primary" onClick={() => setDateRange(dateRange)}>查询</Button>
                            <Button onClick={() => setDateRange(null)}>重置</Button>
                        </Space>
                    </div>
                    <Card
                        data-annotation-id="ce-record-table"
                        title={
                            <Space>
                                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                    新增停机记录
                                </Button>
                                <Button icon={<LineChartOutlined />} onClick={() => setTrendModalOpen(true)}>
                                    查看变量趋势
                                </Button>
                            </Space>
                        }
                    >
                        <Table
                            rowKey="id"
                            dataSource={currentRecords}
                            columns={dynamicColumns}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showTotal: (total) => `共 ${total} 条`,
                            }}
                            size="small"
                            scroll={{ x: 'max-content' }}
                        />
                    </Card>
                </div>
            </div>
            {/* 新增/编辑抽屉 */}
            <Drawer
                title={editingId ? '编辑停机记录' : '新增停机记录'}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                width={640}
                rootClassName="dtm-record-drawer"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button onClick={() => setDrawerOpen(false)}>取消</Button>
                        <Button type="primary" onClick={handleDrawerSubmit}>确定</Button>
                    </div>
                }
            >
                <Form form={form} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="processKey" label="产线工序" rules={[{ required: true, message: '请选择产线工序' }]}>
                                <Select
                                    placeholder="请选择"
                                    options={processOptions}
                                    disabled
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            {drawerFormMode === 'equipment' ? (
                                <Form.Item label="设备">
                                    {(() => {
                                        const code = form.getFieldValue('equipmentCode') as string | undefined;
                                        const name = formEquipmentOptions.find((e) => e.value === code)?.equipmentName || '';
                                        return (
                                            <span style={{ lineHeight: '32px', color: 'rgba(0,0,0,0.85)' }}>
                                                {code ? `【${code}】${name}` : '-'}
                                            </span>
                                        );
                                    })()}
                                    {/* 保留设备编码值，供提交时使用（设备停机记录不可编辑，与列表一致） */}
                                    <Form.Item name="equipmentCode" hidden>
                                        <Input />
                                    </Form.Item>
                                </Form.Item>
                            ) : editingIsProcessRecord ? (
                                <Form.Item name="equipmentCode" label="设备" rules={[{ required: true, message: '请选择设备' }]}>
                                    <TreeSelect
                                        placeholder="选择设备"
                                        treeData={equipmentTreeSelectData}
                                        treeDefaultExpandAll
                                        allowClear
                                        showSearch
                                        treeNodeFilterProp="title"
                                        filterTreeNode={filterEquipmentTreeNode}
                                        disabled
                                    />
                                </Form.Item>
                            ) : (
                                <Form.Item name="equipmentCode" label="设备">
                                    <TreeSelect
                                        placeholder="选择设备"
                                        treeData={equipmentTreeSelectData}
                                        treeDefaultExpandAll
                                        allowClear
                                        showSearch
                                        treeNodeFilterProp="title"
                                        filterTreeNode={filterEquipmentTreeNode}
                                    />
                                </Form.Item>
                            )}
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="stopStartTime" label="停机开始时间" rules={[{ required: true, message: '请选择停机开始时间' }]}>
                                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="stopEndTime" label="停机结束时间" rules={[{ required: true, message: '请选择停机结束时间' }]}>
                                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    {/* 设备停机记录表单才显示故障分类/表面原因；工序停机记录表单不显示 */}
                    {drawerFormMode === 'equipment' && (
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="dcsFaultCategory" label="故障分类">
                                    <Select placeholder="请选择" options={dcsFaultCategoryOptions} allowClear />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="dcsReasonCode" label="表面原因">
                                    <Select
                                        placeholder="请选择"
                                        options={dcsReasonOptions}
                                        allowClear
                                        onChange={(v) => {
                                            const reason = initialDcsReasons.find((r) => r.dcsReasonCode === v);
                                            if (reason) {
                                                form.setFieldValue('dcsFaultCategory', reason.dcsFaultCategory);
                                            }
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="stopType" label="停机类型">
                                <Select
                                    placeholder="请选择"
                                    options={stopTypeOptions}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="停机时长（小时）">
                                <InputNumber value={computedDuration} disabled style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="rootCause" label="根本原因">
                        <Input.TextArea rows={3} maxLength={500} showCount placeholder="输入根本原因" />
                    </Form.Item>
                    <Form.Item name="rootCauseFile" label="根本原因附件">
                        <Upload
                            beforeUpload={(file) => {
                                form.setFieldValue('rootCauseFile', file.name);
                                message.success('附件已上传。');
                                return false;
                            }}
                            showUploadList={false}
                        >
                            <Button icon={<UploadOutlined />}>上传附件</Button>
                        </Upload>
                        {form.getFieldValue('rootCauseFile') && (
                            <Space style={{ marginLeft: 8 }}>
                                <span style={{ fontSize: 12, color: '#1677ff' }}>
                                    <PaperClipOutlined /> {form.getFieldValue('rootCauseFile')}
                                </span>
                                <Button
                                    size="small"
                                    type="link"
                                    danger
                                    icon={<DeleteOutlined />}
                                    style={{ padding: 0 }}
                                    onClick={() => form.setFieldValue('rootCauseFile', '')}
                                />
                            </Space>
                        )}
                    </Form.Item>
                    <Form.Item name="reporter" label="填报人">
                        <Input
                            readOnly
                            value={form.getFieldValue('reporter') || ''}
                            placeholder="选择"
                            suffix={<UserOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />}
                            onClick={() => openPersonModal('drawer', undefined, form.getFieldValue('reporter'))}
                            style={{ cursor: 'pointer' }}
                        />
                    </Form.Item>
                </Form>
            </Drawer>

            {/* 变量趋势弹窗 */}
            <Modal
                title="变量趋势"
                open={trendModalOpen}
                onCancel={() => setTrendModalOpen(false)}
                footer={null}
                width={820}
                destroyOnClose
            >
                <div style={{ marginBottom: 12 }}>
                    <Space>
                        <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>时间范围：</span>
                        <RangePicker
                            showTime
                            format="YYYY-MM-DD HH:mm:ss"
                            value={dateRange as any}
                            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
                            placeholder={['开始时间', '结束时间']}
                        />
                    </Space>
                </div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                    {trendVariables.map((tv) => (
                        <span key={tv.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                            <span style={{ display: 'inline-block', width: 16, height: 3, background: tv.color, borderRadius: 2 }} />
                            {tv.name}
                        </span>
                    ))}
                </div>
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 16, background: '#fafafa' }}>
                    <svg width="100%" viewBox="0 0 740 300" style={{ display: 'block' }}>
                        {/* Y轴刻度 */}
                        {[0, 25, 50, 75, 100].map((v) => {
                            const y = 20 + (1 - v / 100) * 260;
                            return (
                                <g key={v}>
                                    <line x1="60" y1={y} x2="720" y2={y} stroke="#e8e8e8" strokeWidth={1} />
                                    <text x="50" y={y + 4} textAnchor="end" fontSize="11" fill="#999">{v}</text>
                                </g>
                            );
                        })}
                        {/* X轴时间刻度：展示所选时间范围 */}
                        {trendXLabels.map((label, i) => {
                            const x = 60 + (i / 6) * 660;
                            return (
                                <text key={i} x={x} y="295" textAnchor="middle" fontSize="11" fill="#999">{label}</text>
                            );
                        })}
                        {/* 变量折线 */}
                        {trendVariables.map((tv) => (
                            <g key={tv.name}>
                                <path
                                    d={genTrendPath(tv.data)}
                                    fill="none"
                                    stroke={tv.color}
                                    strokeWidth={2}
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                />
                            </g>
                        ))}
                    </svg>
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                    图形展示所选时间范围内与停机条件相关的变量数据折线图。
                </div>
            </Modal>

            {/* 人员选择弹窗 */}
            <Modal
                title="人员选择"
                open={personModalOpen}
                onCancel={() => setPersonModalOpen(false)}
                onOk={confirmPersonSelect}
                okText="确认"
                cancelText="取消"
                width={800}
                styles={{ body: { padding: '16px 24px' } }}
                destroyOnClose
            >
                <div style={{ display: 'flex', minHeight: 360, maxHeight: 420, overflow: 'hidden' }}>
                    {/* 左栏：搜索 + 组织树（人员为叶子节点，复选框单选） */}
                    <div style={{ flex: '55 1 0%', paddingRight: 16, display: 'flex', flexDirection: 'column' }}>
                        <Input
                            allowClear
                            placeholder="请输入关键词筛选"
                            prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />}
                            value={personSearch}
                            onChange={(e) => setPersonSearch(e.target.value)}
                            style={{ marginBottom: 12 }}
                        />
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {renderPersonTreeNodes(filteredPersonTree, 0)}
                        </div>
                    </div>
                    {/* 右栏：最近常选 + 已选择 */}
                    <div
                        style={{
                            flex: '45 1 0%',
                            paddingLeft: 16,
                            borderLeft: '1px solid #f0f0f0',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {frequentReporters.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 13, color: '#f53f3f', marginBottom: 8 }}>
                                    最近常选：
                                </div>
                                <Space wrap>
                                    {frequentReporters.map((name) => (
                                        <span
                                            key={name}
                                            onClick={() =>
                                                setTempSelectedPerson(tempSelectedPerson === name ? '' : name)
                                            }
                                            style={{
                                                display: 'inline-block',
                                                padding: '1px 10px',
                                                border: '1px solid #f53f3f',
                                                borderRadius: 4,
                                                color: '#f53f3f',
                                                fontSize: 13,
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                background:
                                                    tempSelectedPerson === name ? '#f53f3f' : '#fff',
                                                ...(tempSelectedPerson === name
                                                    ? { color: '#fff' }
                                                    : {}),
                                            }}
                                        >
                                            {name}
                                        </span>
                                    ))}
                                </Space>
                            </div>
                        )}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: 13,
                                marginBottom: 8,
                            }}
                        >
                            <span>已选择 {tempSelectedPerson ? 1 : 0}</span>
                            {tempSelectedPerson && (
                                <a onClick={() => setTempSelectedPerson('')}>清空</a>
                            )}
                        </div>
                        {tempSelectedPerson && (
                            <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.88)' }}>
                                {tempSelectedPerson}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
