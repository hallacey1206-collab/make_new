import React, { useMemo, useState } from 'react';
import {
    BellOutlined,
    CloseCircleFilled,
    DeleteOutlined,
    DownOutlined,
    PlayCircleOutlined,
    PlusOutlined,
    RedoOutlined,
    RightOutlined,
    SearchOutlined,
    StarFilled,
    StopOutlined,
    ThunderboltOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {
    Button,
    Card,
    Checkbox,
    Empty,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Radio,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    Tree,
    Typography,
    message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TreeDataNode } from 'antd';
import {
    commonParamOptions,
    equipmentTreeData,
    measurePointList,
    messageTemplateOptions,
    operatorOptions,
    reporterOptions,
    type MeasurePoint,
    type NodeConfig,
    type PushPolicy,
    type StartStopCondition,
} from './data';

const { Text } = Typography;

let idCounter = 0;
const genId = (prefix: string) => `${prefix}-${Date.now()}-${++idCounter}`;

// 人员组织架构树（与停机记录页人员选择一致，人员为叶子节点）
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

// 可选角色列表（人员选择弹窗「角色」Tab）
const ROLES = [
    '超级管理员',
    '全线生产告警推送',
    '基础配置',
    '原料生产告警推送',
    '用料申请',
    '烧成生产告警推送',
    '测点告警推送',
    '辅助巡检监控画面',
    '视频监控',
    '生产实时画面监控',
    '可视化',
    '水泥生产告警推送',
];
const ROLES_SET = new Set(ROLES);

// 展开所有包含人员的节点 key
const personOrgKeys = ['org-root', 'org-sc', 'org-lzb'];

export default function StartStopConfigPage() {
    // ===== 树状态 =====
    const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

    // ===== 配置状态 =====
    const [configs, setConfigs] = useState<Record<string, NodeConfig>>({});

    // ===== 新增节点 Modal =====
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
    const [treeSearch, setTreeSearch] = useState('');

    // ===== 左侧设备树搜索 =====
    const [treeFilterSearch, setTreeFilterSearch] = useState('');

    // ===== 条件行内编辑状态 =====
    const [inlineCondTarget, setInlineCondTarget] = useState<'start' | 'stop'>('start');
    const [inlineCondMode, setInlineCondMode] = useState<'idle' | 'add' | 'edit'>('idle');
    const [inlineCondId, setInlineCondId] = useState<string | null>(null);
    const [inlineCondDraft, setInlineCondDraft] = useState<Partial<StartStopCondition>>({});

    // ===== 推送策略行内编辑状态 =====
    const [inlinePushMode, setInlinePushMode] = useState<'idle' | 'add' | 'edit'>('idle');
    const [inlinePushId, setInlinePushId] = useState<string | null>(null);
    const [inlinePushDraft, setInlinePushDraft] = useState<Partial<PushPolicy>>({});

    // ===== 人员选择弹窗状态（接收人，多选；含角色+用户） =====
    const [personModalOpen, setPersonModalOpen] = useState(false);
    const [personModalTab, setPersonModalTab] = useState<'role' | 'user'>('role');
    const [roleSearch, setRoleSearch] = useState(''); // 角色 Tab 内的关键词筛选
    const [userSearch, setUserSearch] = useState(''); // 用户 Tab 内的关键词筛选
    const [tempSelectedPersons, setTempSelectedPersons] = useState<string[]>([]);
    const [expandedOrgKeys, setExpandedOrgKeys] = useState<React.Key[]>(personOrgKeys);

    // ===== 变量选择弹窗状态 =====
    const [varModalOpen, setVarModalOpen] = useState(false);
    const [varSearch, setVarSearch] = useState('');
    const [varSelectedKeys, setVarSelectedKeys] = useState<React.Key[]>([]);
    const [varTempSelectedKeys, setVarTempSelectedKeys] = useState<React.Key[]>([]); // 弹窗内临时勾选（跨页保留）
    const [varModalTarget, setVarModalTarget] = useState<'condition' | 'stopReason' | 'faultPoint'>('condition'); // 弹窗用途

    // 查找树节点
    const findNode = (nodes: TreeDataNode[], key: string): TreeDataNode | null => {
        for (const n of nodes) {
            if (n.key === key) return n;
            if (n.children) {
                const found = findNode(n.children, key);
                if (found) return found;
            }
        }
        return null;
    };

    // 当前选中节点的配置（若不存在则返回空默认值）
    const currentConfig = useMemo<NodeConfig | undefined>(() => {
        if (!selectedKey) return undefined;
        const existing = configs[selectedKey];
        if (existing) return existing;
        const node = findNode(treeData, selectedKey);
        if (!node) return undefined;
        return {
            nodeKey: selectedKey,
            nodeTitle: node.title as string,
            isProcess: !node.isLeaf,
            startConditions: [],
            stopConditions: [],
            pushPolicies: [],
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedKey, configs, treeData]);

    // 工序节点“按主机设备配置”时，面板实际读写的有效 key（选中设备后切换到该设备）
    const effectiveKey = useMemo<string | null>(() => {
        if (currentConfig?.isProcess && currentConfig.byHostDevice && currentConfig.hostDeviceKey) {
            return currentConfig.hostDeviceKey;
        }
        return selectedKey;
    }, [currentConfig, selectedKey]);

    // 面板实际渲染/操作的配置（按有效 key 解析，缺失时返回默认空配置）
    const panelConfig = useMemo<NodeConfig | undefined>(() => {
        if (!effectiveKey) return undefined;
        const existing = configs[effectiveKey];
        if (existing) return existing;
        const node = findNode(treeData, effectiveKey);
        if (!node) return undefined;
        return {
            nodeKey: effectiveKey,
            nodeTitle: node.title as string,
            isProcess: !node.isLeaf,
            startConditions: [],
            stopConditions: [],
            pushPolicies: [],
        };
    }, [effectiveKey, configs, treeData]);

    // 工序节点下“已添加到设备树”的设备列表（用于按主机设备配置的下拉框）
    const processDeviceOptions = useMemo(() => {
        if (!currentConfig?.isProcess || !selectedKey) return [];
        const node = findNode(treeData, selectedKey);
        return (node?.children || []).map((c) => ({
            label: c.title as string,
            value: c.key as string,
        }));
    }, [currentConfig, selectedKey, treeData]);

    // 是否展示开停机条件 / 消息推送面板
    // 工序节点“按主机设备配置”时，仅提供设备选择，选中设备后不再带出条件配置面板
    const showPanels =
        !currentConfig?.isProcess || !currentConfig.byHostDevice;

    // 搜索过滤后的设备树（模糊匹配工序或设备名称）
    const filteredTreeData = useMemo(() => {
        const kw = treeFilterSearch.trim().toLowerCase();
        if (!kw) return treeData;
        const result: TreeDataNode[] = [];
        for (const proc of treeData) {
            const procTitle = (proc.title as string).toLowerCase();
            const matchedChildren = (proc.children || []).filter(
                (eq) => (eq.title as string).toLowerCase().includes(kw)
            );
            if (procTitle.includes(kw)) {
                // 工序名匹配，整棵子树保留
                result.push(proc);
            } else if (matchedChildren.length > 0) {
                // 仅设备匹配，保留工序 + 匹配的设备
                result.push({ ...proc, children: matchedChildren });
            }
        }
        return result;
    }, [treeData, treeFilterSearch]);

    // 搜索时自动展开匹配节点所在的工序
    const filteredExpandedKeys = useMemo(() => {
        const kw = treeFilterSearch.trim().toLowerCase();
        if (!kw) return expandedKeys;
        const keys: React.Key[] = [];
        for (const proc of filteredTreeData) {
            if (proc.children && proc.children.length > 0) {
                keys.push(proc.key);
            }
        }
        return keys;
    }, [filteredTreeData, treeFilterSearch, expandedKeys]);

    // ===== 树操作 =====
    const handleAddNode = () => {
        setCheckedKeys([]);
        setAddModalOpen(true);
    };

    // 收集所有已存在的节点 key（用于去重）
    const collectExistingKeys = (nodes: TreeDataNode[]): Set<string> => {
        const keys = new Set<string>();
        const walk = (list: TreeDataNode[]) => {
            for (const n of list) {
                keys.add(n.key as string);
                if (n.children) walk(n.children);
            }
        };
        walk(nodes);
        return keys;
    };

    const handleAddSubmit = () => {
        if (checkedKeys.length === 0) {
            message.warning('请至少勾选一个工序或设备');
            return;
        }

        // checkStrictly 模式下工序和设备独立勾选；勾选工序时自动带出其下全部设备
        const checkedSet = new Set(checkedKeys.map(String));
        const existingKeys = collectExistingKeys(treeData);

        // 按 equipmentTreeData 的结构，将被勾选的工序及其设备批量加入
        const newTree: TreeDataNode[] = [];
        const newExpandedKeys: React.Key[] = [];

        for (const proc of equipmentTreeData) {
            const procKey = proc.key as string;
            const procChecked = checkedSet.has(procKey);
            const childEquipments = (proc.children || []).filter(
                (eq) => procChecked || checkedSet.has(eq.key as string)
            );

            // 过滤掉已存在的设备
            const newEquipments = childEquipments
                .filter((eq) => !existingKeys.has(eq.key as string))
                .map((eq) => ({
                    ...eq,
                    isLeaf: true,
                }));

            const procAlreadyInTree = existingKeys.has(procKey);

            if (procChecked && !procAlreadyInTree) {
                // 整个工序被勾选且尚未添加 → 新增工序+其下设备
                newTree.push({
                    key: procKey,
                    title: proc.title as string,
                    isLeaf: false,
                    children: newEquipments,
                });
                newExpandedKeys.push(procKey);
            } else if (newEquipments.length > 0 && !procAlreadyInTree) {
                // 工序不在树中但勾选了其下设备 → 新建工序节点并加入勾选的设备
                newTree.push({
                    key: procKey,
                    title: proc.title as string,
                    isLeaf: false,
                    children: newEquipments,
                });
                newExpandedKeys.push(procKey);
            } else if (newEquipments.length > 0 && procAlreadyInTree) {
                // 工序已存在，仅追加新设备
                setTreeData((prev) =>
                    prev.map((n) =>
                        n.key === procKey
                            ? { ...n, children: [...(n.children || []), ...newEquipments] }
                            : n
                    )
                );
            }
        }

        if (newTree.length > 0) {
            setTreeData((prev) => [...prev, ...newTree]);
        }
        if (newExpandedKeys.length > 0) {
            setExpandedKeys((prev) => [...prev, ...newExpandedKeys]);
        }

        const addedCount = newTree.length + newExpandedKeys.filter((k) => !newTree.some((t) => t.key === k)).length;
        if (addedCount === 0) {
            message.info('所选内容已存在，无需重复添加');
        } else {
            message.success(`已添加 ${addedCount} 项`);
        }
        setAddModalOpen(false);
    };

    const handleDeleteNode = (key: string) => {
        const node = findNode(treeData, key);
        const keysToDelete: string[] = [key];
        if (node?.children) {
            node.children.forEach((c) => keysToDelete.push(c.key as string));
        }
        setTreeData((prev) =>
            prev
                .filter((n) => n.key !== key)
                .map((n) => ({
                    ...n,
                    children: n.children?.filter((c) => c.key !== key),
                }))
        );
        setConfigs((prev) => {
            const next = { ...prev };
            keysToDelete.forEach((k) => delete next[k]);
            return next;
        });
        if (selectedKey === key) {
            setSelectedKey(null);
        }
        message.success('节点已删除');
    };

    const handleSelect = (keys: React.Key[]) => {
        if (keys.length > 0) {
            const key = String(keys[0]);
            setSelectedKey(key);
        } else {
            setSelectedKey(null);
        }
    };

    // ===== 配置更新 =====
    const updateConfig = (nodeKey: string, updater: (config: NodeConfig) => NodeConfig) => {
        setConfigs((prev) => {
            const node = findNode(treeData, nodeKey);
            const existing: NodeConfig = prev[nodeKey] || {
                nodeKey,
                nodeTitle: node ? (node.title as string) : '',
                isProcess: !node?.isLeaf,
                startConditions: [],
                stopConditions: [],
                pushPolicies: [],
            };
            return { ...prev, [nodeKey]: updater({ ...existing }) };
        });
    };

    // ===== 条件操作 =====
    const startInlineCond = (target: 'start' | 'stop', editingId?: string) => {
        if (!effectiveKey) return;
        setInlineCondTarget(target);
        if (editingId) {
            const config = configs[effectiveKey];
            const list = target === 'start' ? config.startConditions : config.stopConditions;
            const cond = list.find((c) => c.id === editingId);
            if (cond) {
                setInlineCondId(editingId);
                setInlineCondMode('edit');
                setInlineCondDraft({ ...cond });
            }
        } else {
            setInlineCondId(null);
            setInlineCondMode('add');
            setInlineCondDraft({ logic: 'AND', delaySec: 0, type: 'signal', operator: '=' });
        }
    };

    const cancelInlineCond = () => {
        setInlineCondId(null);
        setInlineCondMode('idle');
        setInlineCondDraft({});
    };

    const updateInlineDraft = (field: keyof StartStopCondition, value: string | number) => {
        setInlineCondDraft((prev) => ({ ...prev, [field]: value }));
    };

    const saveInlineCond = () => {
        const d = inlineCondDraft;
        if (!d.param || !d.operator || !d.threshold) {
            message.warning('请填写完整的条件信息');
            return;
        }
        const newCond: StartStopCondition = {
            id: inlineCondId || genId('cond'),
            type: d.type || 'parameter',
            param: d.param!,
            customCode: d.customCode || '',
            operator: d.operator!,
            threshold: d.threshold!,
            logic: d.logic || 'AND',
            delaySec: d.delaySec ?? 0,
            description: d.description || '',
        };
        updateConfig(effectiveKey!, (config) => {
            const list =
                inlineCondTarget === 'start'
                    ? [...config.startConditions]
                    : [...config.stopConditions];
            const idx = list.findIndex((c) => c.id === newCond.id);
            if (idx >= 0) list[idx] = newCond;
            else list.push(newCond);
            return inlineCondTarget === 'start'
                ? { ...config, startConditions: list }
                : { ...config, stopConditions: list };
        });
        cancelInlineCond();
        message.success(inlineCondMode === 'edit' ? '条件已更新' : '条件已添加');
    };

    const handleDeleteCond = (target: 'start' | 'stop', id: string) => {
        updateConfig(effectiveKey!, (config) => {
            const list = target === 'start' ? config.startConditions : config.stopConditions;
            const newList = list.filter((c) => c.id !== id);
            return target === 'start'
                ? { ...config, startConditions: newList }
                : { ...config, stopConditions: newList };
        });
        message.success('条件已删除');
    };

    // ===== 推送策略操作 =====
    const startInlinePush = (editingId?: string) => {
        if (!effectiveKey) return;
        if (editingId) {
            const config = configs[effectiveKey];
            const policy = config?.pushPolicies.find((p) => p.id === editingId);
            if (policy) {
                setInlinePushId(editingId);
                setInlinePushMode('edit');
                setInlinePushDraft({ ...policy });
            }
        } else {
            setInlinePushId(null);
            setInlinePushMode('add');
            setInlinePushDraft({ event: 'start' });
        }
    };

    const cancelInlinePush = () => {
        setInlinePushId(null);
        setInlinePushMode('idle');
        setInlinePushDraft({});
    };

    const updateInlinePushDraft = (field: keyof PushPolicy, value: string) => {
        setInlinePushDraft((prev) => ({ ...prev, [field]: value }));
    };

    const saveInlinePush = () => {
        const d = inlinePushDraft;
        if (!d.event || !d.template) {
            message.warning('请选择触发事件和消息模板');
            return;
        }
        const newPolicy: PushPolicy = {
            id: inlinePushId || genId('pp'),
            event: d.event as PushPolicy['event'],
            template: d.template!,
            recipients: d.recipients || [],
        };
        updateConfig(effectiveKey!, (config) => {
            const list = [...config.pushPolicies];
            const idx = list.findIndex((p) => p.id === newPolicy.id);
            if (idx >= 0) list[idx] = newPolicy;
            else list.push(newPolicy);
            return { ...config, pushPolicies: list };
        });
        cancelInlinePush();
        message.success(inlinePushMode === 'edit' ? '策略已更新' : '策略已添加');
    };

    const handleDeletePush = (id: string) => {
        updateConfig(effectiveKey!, (config) => ({
            ...config,
            pushPolicies: config.pushPolicies.filter((p) => p.id !== id),
        }));
        message.success('策略已删除');
    };

    // ===== 人员选择弹窗（多选，用于接收人） =====
    const openPersonModal = () => {
        setTempSelectedPersons(inlinePushDraft.recipients ? [...inlinePushDraft.recipients] : []);
        setRoleSearch('');
        setUserSearch('');
        setExpandedOrgKeys(personOrgKeys);
        setPersonModalTab('role');
        setPersonModalOpen(true);
    };

    // 判断已选项是角色还是用户（用于右侧标签颜色区分）
    const isRoleTitle = (title: string) => ROLES_SET.has(title);

    const confirmPersonSelect = () => {
        setInlinePushDraft((prev) => ({ ...prev, recipients: [...tempSelectedPersons] }));
        setPersonModalOpen(false);
    };

    const togglePerson = (key: string) => {
        setTempSelectedPersons((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    // 搜索过滤后的组织树（仅保留匹配人员及其上级组织）
    const filteredPersonTree = useMemo(() => {
        const keyword = userSearch.trim().toLowerCase();
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
    }, [userSearch]);

    // 角色 Tab 搜索过滤
    const filteredRoles = useMemo(() => {
        const keyword = roleSearch.trim().toLowerCase();
        if (!keyword) return ROLES;
        return ROLES.filter((r) => r.toLowerCase().includes(keyword));
    }, [roleSearch]);

    // 渲染组织树：组织节点带展开/收起箭头，人员叶子节点带复选框（多选）
    const renderPersonTreeNodes = (nodes: any[], level: number): React.ReactNode =>
        nodes.map((node: any) => {
            if (node.isPerson) {
                const checked = tempSelectedPersons.includes(node.key);
                return (
                    <div
                        key={node.key}
                        onClick={() => togglePerson(node.key)}
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
                            onChange={() => togglePerson(node.key)}
                        />
                        <span>{node.title}</span>
                    </div>
                );
            }
            const expanded = !!userSearch.trim() || expandedOrgKeys.includes(node.key);
            return (
                <div key={node.key}>
                    <div
                        onClick={() => {
                            if (!userSearch.trim()) {
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

    // ===== 变量选择弹窗 =====
    // 打开弹窗：回显当前草稿中已选的变量
    const openVarModal = (target: 'condition' | 'stopReason' | 'faultPoint' = 'condition') => {
        setVarModalTarget(target);
        if (target === 'stopReason') {
            const currentName = effectiveKey ? (configs[effectiveKey]?.stopReasonParam || '') : '';
            const mp = measurePointList.find((m) => m.name === currentName);
            setVarTempSelectedKeys(mp ? [mp.id] : []);
        } else if (target === 'faultPoint') {
            const currentName = effectiveKey ? (configs[effectiveKey]?.faultPointParam || '') : '';
            const mp = measurePointList.find((m) => m.name === currentName);
            setVarTempSelectedKeys(mp ? [mp.id] : []);
        } else {
            const mp = measurePointList.find((m) => m.name === inlineCondDraft.param);
            setVarTempSelectedKeys(mp ? [mp.id] : []);
        }
        setVarSearch('');
        setVarModalOpen(true);
    };

    // 弹窗内表格数据（按搜索词过滤）
    const varTableData = useMemo(() => {
        const kw = varSearch.trim().toLowerCase();
        if (!kw) return measurePointList;
        return measurePointList.filter(
            (mp) =>
                mp.name.toLowerCase().includes(kw) ||
                mp.code.toLowerCase().includes(kw) ||
                (mp.customCode || '').toLowerCase().includes(kw)
        );
    }, [varSearch]);

    // 确认选择：把选中的测点写入对应目标
    const confirmVarSelect = () => {
        if (varTempSelectedKeys.length === 0) {
            if (varModalTarget === 'stopReason') {
                updateConfig(effectiveKey!, (config) => ({ ...config, stopReasonParam: '', stopReasonCustomCode: '' }));
            } else if (varModalTarget === 'faultPoint') {
                updateConfig(effectiveKey!, (config) => ({ ...config, faultPointParam: '', faultPointCustomCode: '' }));
            } else {
                setInlineCondDraft((prev) => ({ ...prev, param: '', customCode: '' }));
            }
        } else {
            const mp = measurePointList.find((m) => m.id === String(varTempSelectedKeys[0]));
            const val = mp ? mp.name : String(varTempSelectedKeys[0]);
            const customCode = mp ? mp.customCode : '';
            if (varModalTarget === 'stopReason') {
                updateConfig(effectiveKey!, (config) => ({ ...config, stopReasonParam: val, stopReasonCustomCode: customCode }));
            } else if (varModalTarget === 'faultPoint') {
                updateConfig(effectiveKey!, (config) => ({ ...config, faultPointParam: val, faultPointCustomCode: customCode }));
            } else {
                setInlineCondDraft((prev) => ({ ...prev, param: val, customCode }));
            }
        }
        setVarModalOpen(false);
    };

    // 一键清除已选点位（停机原因 / 故障点位 / 条件参数）
    const clearPointSelection = (target: 'condition' | 'stopReason' | 'faultPoint') => {
        if (target === 'condition') {
            setInlineCondDraft((prev) => ({ ...prev, param: '', customCode: '' }));
            return;
        }
        if (!effectiveKey) return;
        if (target === 'stopReason') {
            updateConfig(effectiveKey, (config) => ({ ...config, stopReasonParam: '', stopReasonCustomCode: '' }));
        } else {
            updateConfig(effectiveKey, (config) => ({ ...config, faultPointParam: '', faultPointCustomCode: '' }));
        }
    };

    // 点位选择框后缀：已选值时显示"清除"图标，点一下即可清空选择
    const renderPointSuffix = (hasValue: boolean, target: 'condition' | 'stopReason' | 'faultPoint') => {
        if (!hasValue) {
            return <SearchOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />;
        }
        return (
            <span
                onClick={(e) => {
                    e.stopPropagation();
                    clearPointSelection(target);
                }}
                title="清除选择"
                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
            >
                <CloseCircleFilled style={{ color: 'rgba(0,0,0,0.45)', marginRight: 6 }} />
                <SearchOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />
            </span>
        );
    };

    // ===== 表格列定义 =====
    // 判断某行是否正在行内编辑（编辑现有 or 新增）
    const isRowEditing = (target: 'start' | 'stop', record: StartStopCondition) => {
        if (inlineCondTarget !== target) return false;
        if (inlineCondMode === 'edit' && inlineCondId === record.id) return true;
        if (inlineCondMode === 'add' && record.id === '__new__') return true;
        return false;
    };

    const buildCondColumns = (target: 'start' | 'stop'): ColumnsType<StartStopCondition> => [
        { title: '序号', width: 55, render: (_, __, i) => i + 1 },
        {
            title: '自定义编码',
            width: 140,
            dataIndex: 'customCode',
            ellipsis: true,
            render: (v: string, record: StartStopCondition) => {
                if (isRowEditing(target, record)) {
                    return inlineCondDraft.customCode || '-';
                }
                return v || '-';
            },
        },
        {
            title: '参数/变量',
            width: 120,
            dataIndex: 'param',
            ellipsis: true,
            render: (v: string, record: StartStopCondition) => {
                if (isRowEditing(target, record)) {
                    return (
                        <Input
                            size="small"
                            readOnly
                            value={inlineCondDraft.param}
                            suffix={renderPointSuffix(!!inlineCondDraft.param, 'condition')}
                            placeholder="请选择"
                                    onClick={() => openVarModal('condition')}
                            style={{ cursor: 'pointer' }}
                        />
                    );
                }
                return v;
            },
        },
        {
            title: '运算符',
            width: 60,
            dataIndex: 'operator',
            render: (v: string, record: StartStopCondition) => {
                if (isRowEditing(target, record)) {
                    return (
                        <Select
                            size="small"
                            value={inlineCondDraft.operator}
                            onChange={(val) => updateInlineDraft('operator', val)}
                            options={operatorOptions}
                            style={{ width: '100%' }}
                        />
                    );
                }
                return v;
            },
        },
        {
            title: '阈值',
            width: 90,
            dataIndex: 'threshold',
            ellipsis: true,
            render: (v: string, record: StartStopCondition) => {
                if (isRowEditing(target, record)) {
                    return (
                        <Input
                            size="small"
                            value={inlineCondDraft.threshold}
                            onChange={(e) => updateInlineDraft('threshold', e.target.value)}
                            placeholder="如 85°C"
                        />
                    );
                }
                return v;
            },
        },
        {
            title: '稳定时长(秒)',
            width: 70,
            dataIndex: 'delaySec',
            render: (v: number, record: StartStopCondition) => {
                if (isRowEditing(target, record)) {
                    return (
                        <InputNumber
                            size="small"
                            min={0}
                            max={3600}
                            value={inlineCondDraft.delaySec}
                            onChange={(val) => updateInlineDraft('delaySec', val ?? 0)}
                            style={{ width: '100%' }}
                        />
                    );
                }
                return v;
            },
        },
        {
            title: '备注',
            dataIndex: 'description',
            ellipsis: true,
            width: 120,
            render: (v: string, record: StartStopCondition) => {
                if (isRowEditing(target, record)) {
                    return (
                        <Input
                            size="small"
                            value={inlineCondDraft.description}
                            onChange={(e) => updateInlineDraft('description', e.target.value)}
                            placeholder="条件说明"
                        />
                    );
                }
                return v;
            },
        },
        {
            title: '操作',
            width: 110,
            fixed: 'right' as const,
            render: (_, record) => {
                if (isRowEditing(target, record)) {
                    return (
                        <Space size={4}>
                            <Button size="small" type="link" onClick={saveInlineCond}>
                                保存
                            </Button>
                            <Button size="small" type="link" onClick={cancelInlineCond}>
                                取消
                            </Button>
                        </Space>
                    );
                }
                return (
                    <Space size={4}>
                        <Button size="small" type="link" onClick={() => startInlineCond(target, record.id)}>
                            编辑
                        </Button>
                        <Popconfirm title="确认删除该条件？" onConfirm={() => handleDeleteCond(target, record.id)}>
                            <Button size="small" type="link" danger>
                                删除
                            </Button>
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    const pushColumns: ColumnsType<PushPolicy> = [
        { title: '序号', width: 55, render: (_, __, i) => i + 1 },
        {
            title: '事件',
            width: 80,
            dataIndex: 'event',
            render: (v: string, record: PushPolicy) => {
                if (isPushRowEditing(record)) {
                    return (
                    <Select
                        size="small"
                        value={inlinePushDraft.event}
                        onChange={(v) => updateInlinePushDraft('event', v)}
                        style={{ width: '100%' }}
                        options={[
                            { value: 'start', label: '开机' },
                            { value: 'stop', label: '停机' },
                            { value: 'faultStop', label: '故障停机' },
                        ]}
                    />
                );
            }
            const eventLabel = v === 'start' ? '开机' : v === 'faultStop' ? '故障停机' : '停机';
            return <Tag color={v === 'start' ? 'green' : v === 'faultStop' ? 'orange' : 'red'}>{eventLabel}</Tag>;
            },
        },
        {
            title: '消息模板',
            dataIndex: 'template',
            render: (v: string, record: PushPolicy) => {
                if (isPushRowEditing(record)) {
                    return (
                        <Select
                            size="small"
                            showSearch
                            value={inlinePushDraft.template}
                            onChange={(val) => updateInlinePushDraft('template', val)}
                            options={messageTemplateOptions}
                            style={{ width: '100%' }}
                            placeholder="请选择消息模板"
                        />
                    );
                }
                const opt = messageTemplateOptions.find((o) => o.value === v);
                return opt ? opt.label : v;
            },
        },
        {
            title: '接收人',
            dataIndex: 'recipients',
            render: (v: string[] | undefined, record: PushPolicy) => {
                if (isPushRowEditing(record)) {
                    const names = inlinePushDraft.recipients || [];
                    return (
                        <div
                            className="ant-input ant-input-sm"
                            onClick={openPersonModal}
                            style={{
                                cursor: 'pointer',
                                minHeight: 24,
                                height: 'auto',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 4,
                                padding: '1px 7px 1px 11px',
                            }}
                        >
                            <Space size={4} wrap style={{ flex: 1, lineHeight: '22px' }}>
                                {names.length > 0 ? (
                                    names.map((n) => {
                                        const isRole = isRoleTitle(n);
                                        return (
                                            <Tag
                                                key={n}
                                                style={{ fontSize: 12 }}
                                                closable
                                                onClose={(e) => {
                                                    e.stopPropagation();
                                                    setInlinePushDraft((prev) => ({
                                                        ...prev,
                                                        recipients: (prev.recipients || []).filter((x) => x !== n),
                                                    }));
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                color={isRole ? 'blue' : 'green'}
                                                bordered
                                            >
                                                {n}
                                            </Tag>
                                        );
                                    })
                                ) : (
                                    <span style={{ color: 'rgba(0,0,0,0.25)' }}>选择</span>
                                )}
                            </Space>
                            <UserOutlined style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, marginLeft: 4 }} />
                        </div>
                    );
                }
                return v && v.length > 0 ? (
                    <Space size={4} wrap>
                        {v.map((n) => (
                            <Tag key={n}>{n}</Tag>
                        ))}
                    </Space>
                ) : (
                    '-'
                );
            },
        },
        {
            title: '操作',
            width: 110,
            fixed: 'right' as const,
            render: (_, record) => {
                if (isPushRowEditing(record)) {
                    return (
                        <Space size={4}>
                            <Button size="small" type="link" onClick={saveInlinePush}>保存</Button>
                            <Button size="small" type="link" onClick={cancelInlinePush}>取消</Button>
                        </Space>
                    );
                }
                return (
                    <Space size={4}>
                        <Button size="small" type="link" onClick={() => startInlinePush(record.id)}>编辑</Button>
                        <Popconfirm title="确认删除该策略？" onConfirm={() => handleDeletePush(record.id)}>
                            <Button size="small" type="link" danger>删除</Button>
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    // 判断推送策略某行是否正在行内编辑
    const isPushRowEditing = (record: PushPolicy) => {
        if (inlinePushMode === 'edit' && inlinePushId === record.id) return true;
        if (inlinePushMode === 'add' && record.id === '__new__') return true;
        return false;
    };

    // ===== 树节点标题渲染 =====
    const renderTreeTitle = (node: TreeDataNode) => {
        const key = node.key as string;
        const isProcess = !node.isLeaf;
        // 判断是否为工序运行设备
        const isPrimaryEquipment = !isProcess && configs[key]?.isPrimaryEquipment === true;
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingRight: 4,
                }}
            >
                <span
                    style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    {isPrimaryEquipment && (
                        <StarFilled style={{ color: '#faad14', fontSize: 13 }} />
                    )}
                    {node.title as string}
                </span>
                <Space
                    size={0}
                    className="dtm-node-actions"
                    style={{ flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >

                    <Popconfirm
                        title="确认删除该节点？"
                        description={isProcess ? '删除工序将同时删除其下所有设备。' : undefined}
                        onConfirm={() => handleDeleteNode(key)}
                    >
                        <Button
                            size="small"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            style={{ padding: '0 2px' }}
                        />
                    </Popconfirm>
                </Space>
            </div>
        );
    };

    // ===== 渲染 =====
    return (
        <div className="dtm-page-stack">
            <div className="dtm-tree-table-layout">
                {/* 左侧工序设备树 */}
                <Card
                    className="dtm-tree-panel dtm-config-tree"
                    size="small"
                    title="工序设备树"
                    data-annotation-id="ssc-tree"
                    extra={
                        <Button
                            size="small"
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddNode}
                        >
                            新增
                        </Button>
                    }
                >
                    {treeData.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="暂无工序设备，请点击「新增」添加"
                            style={{ margin: '20px 0' }}
                        />
                    ) : (
                        <>
                            <Input
                                allowClear
                                prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />}
                                placeholder="搜索工序或设备"
                                value={treeFilterSearch}
                                onChange={(e) => setTreeFilterSearch(e.target.value)}
                                style={{ marginBottom: 8 }}
                            />
                            <Tree
                                treeData={filteredTreeData}
                                titleRender={renderTreeTitle}
                                selectedKeys={selectedKey ? [selectedKey] : []}
                                expandedKeys={filteredExpandedKeys}
                                onExpand={(keys) => setExpandedKeys(keys)}
                                onSelect={handleSelect}
                                blockNode
                            />
                        </>
                    )}
                </Card>

                {/* 右侧配置内容 */}
                <div className="dtm-table-panel">
                    {!selectedKey || !currentConfig ? (
                        <Card>
                            <Empty
                                description={
                                    selectedKey
                                        ? '正在加载配置…'
                                        : '请先在左侧添加工序或设备，选择后配置开停机条件'
                                }
                                style={{ margin: '60px 0' }}
                            />
                        </Card>
                    ) : (
                        <Card
                            title={
                                <Space>
                                    <ThunderboltOutlined style={{ color: '#1677ff' }} />
                                    <span>{currentConfig.nodeTitle}</span>
                                    {currentConfig.isProcess ? (
                                        <Tag color="blue">工序</Tag>
                                    ) : (
                                        <Tag color="green">设备</Tag>
                                    )}
                                </Space>
                            }
                            data-annotation-id="ssc-config-header"
                        >
                            {/* 停机原因点位 + 故障点位（仅设备节点显示，同行展示） */}
                            {!currentConfig.isProcess && (
                                <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                                    <div style={{ flex: 1, minWidth: 0 }} data-annotation-id="ssc-stop-reason">
                                        <div style={{ marginBottom: 8 }}>
                                            <Space>
                                                <StopOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
                                                <Text strong>停机原因点位</Text>
                                            </Space>
                                        </div>
                                        <Input
                                            readOnly
                                            value={currentConfig.stopReasonParam
                                                ? currentConfig.stopReasonCustomCode
                                                    ? `${currentConfig.stopReasonParam}（${currentConfig.stopReasonCustomCode}）`
                                                    : currentConfig.stopReasonParam
                                                : ''}
                                            placeholder="请选择停机原因对应的参数/变量"
                                            suffix={renderPointSuffix(!!currentConfig.stopReasonParam, 'stopReason')}
                                            onClick={() => openVarModal('stopReason')}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }} data-annotation-id="ssc-fault-point">
                                        <div style={{ marginBottom: 8 }}>
                                            <Space>
                                                <ThunderboltOutlined style={{ color: '#faad14', fontSize: 16 }} />
                                                <Text strong>故障点位</Text>
                                            </Space>
                                        </div>
                                        <Input
                                            readOnly
                                            value={currentConfig.faultPointParam
                                                ? currentConfig.faultPointCustomCode
                                                    ? `${currentConfig.faultPointParam}（${currentConfig.faultPointCustomCode}）`
                                                    : currentConfig.faultPointParam
                                                : ''}
                                            placeholder="请选择故障点位对应的参数/变量"
                                            suffix={renderPointSuffix(!!currentConfig.faultPointParam, 'faultPoint')}
                                            onClick={() => openVarModal('faultPoint')}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* 工序节点：是否按主机设备配置 */}
                            {currentConfig.isProcess && (
                                <div style={{ marginBottom: 24 }} data-annotation-id="ssc-by-host-device">
                                    <div style={{ marginBottom: 8 }}>
                                        <Space>
                                            <StarFilled style={{ color: '#faad14', fontSize: 16 }} />
                                            <Text strong>是否继承主机设备配置</Text>
                                        </Space>
                                    </div>
                                    <Radio.Group
                                        value={currentConfig.byHostDevice ? 'yes' : 'no'}
                                        onChange={(e) =>
                                            updateConfig(selectedKey!, (config) => ({
                                                ...config,
                                                byHostDevice: e.target.value === 'yes',
                                                hostDeviceKey:
                                                    e.target.value === 'yes' ? config.hostDeviceKey : undefined,
                                            }))
                                        }
                                    >
                                        <Radio value="no">否（工序单独配置）</Radio>
                                        <Radio value="yes">是（继承主机设备配置）</Radio>
                                    </Radio.Group>
                                </div>
                            )}

                            {/* 工序节点 + 按主机设备配置：设备选择下拉框 */}
                            {currentConfig.isProcess && currentConfig.byHostDevice && (
                                <div style={{ marginBottom: 24 }} data-annotation-id="ssc-host-device-select">
                                    <div style={{ marginBottom: 8 }}>
                                        <Space>
                                            <ThunderboltOutlined style={{ color: '#1677ff', fontSize: 16 }} />
                                            <Text strong>选择主机设备</Text>
                                        </Space>
                                    </div>
                                    {processDeviceOptions.length === 0 ? (
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            description="该工序下尚未添加设备，请先在左侧设备树中勾选设备"
                                            style={{ margin: '8px 0' }}
                                        />
                                    ) : (
                                        <Select
                                            style={{ width: 360 }}
                                            placeholder="请选择主机设备"
                                            value={currentConfig.hostDeviceKey}
                                            onChange={(val) =>
                                                updateConfig(selectedKey!, (config) => ({ ...config, hostDeviceKey: val }))
                                            }
                                            options={processDeviceOptions}
                                            showSearch
                                            optionFilterProp="label"
                                        />
                                    )}
                                </div>
                            )}

                            {/* 工序节点 + 单独配置：选择故障点位 */}
                            {currentConfig.isProcess && !currentConfig.byHostDevice && (
                                <div style={{ marginBottom: 24 }} data-annotation-id="ssc-process-fault-point">
                                    <div style={{ marginBottom: 8 }}>
                                        <Space>
                                            <ThunderboltOutlined style={{ color: '#faad14', fontSize: 16 }} />
                                            <Text strong>选择故障点位</Text>
                                        </Space>
                                    </div>
                                    <Input
                                        readOnly
                                        value={
                                            currentConfig.faultPointParam
                                                ? currentConfig.faultPointCustomCode
                                                    ? `${currentConfig.faultPointParam}（${currentConfig.faultPointCustomCode}）`
                                                    : currentConfig.faultPointParam
                                                : ''
                                        }
                                        placeholder="请选择故障点位对应的参数/变量"
                                        suffix={renderPointSuffix(!!currentConfig.faultPointParam, 'faultPoint')}
                                        onClick={() => openVarModal('faultPoint')}
                                        style={{ cursor: 'pointer', maxWidth: 480 }}
                                    />
                                </div>
                            )}

                            {showPanels && (
                            <>
                            {/* 开机条件 */}
                            <div style={{ marginBottom: 24 }} data-annotation-id="ssc-start-conditions">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Space>
                                        <PlayCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                                        <Text strong>开机条件</Text>
                                    </Space>
                                    <Space>
                                        {panelConfig!.startConditions.length > 0 && (
                                            <Radio.Group
                                                size="small"
                                                value={panelConfig!.startLogicMode || 'AND'}
                                                onChange={(e) => {
                                                    updateConfig(effectiveKey!, (config) => ({ ...config, startLogicMode: e.target.value }));
                                                }}
                                            >
                                                <Radio.Button value="AND">满足所有条件</Radio.Button>
                                                <Radio.Button value="OR">满足任一条件</Radio.Button>
                                            </Radio.Group>
                                        )}
                                        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => startInlineCond('start')}>
                                            新增条件
                                        </Button>
                                    </Space>
                                </div>
                                <Table
                                    rowKey="id"
                                    dataSource={[
                                        ...(inlineCondTarget === 'start' && inlineCondMode === 'add' ? [{ id: '__new__' }] : []),
                                        ...panelConfig!.startConditions,
                                    ] as StartStopCondition[]}
                                    columns={buildCondColumns('start')}
                                    size="small"
                                    pagination={false}
                                    scroll={{ x: 'max-content' }}
                                    locale={{ emptyText: '暂无开机条件，请点击「新增条件」添加' }}
                                    rowClassName={(record) => record.id === '__new__' ? 'dtm-inline-editing-row' : ''}
                                />
                            </div>

                            {/* 停机条件 */}
                            <div style={{ marginBottom: 24 }} data-annotation-id="ssc-stop-conditions">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Space>
                                        <StopOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
                                        <Text strong>停机条件</Text>
                                    </Space>
                                    <Space>
                                        {panelConfig!.stopConditions.length > 0 && (
                                            <Radio.Group
                                                size="small"
                                                value={panelConfig!.stopLogicMode || 'AND'}
                                                onChange={(e) => {
                                                    updateConfig(effectiveKey!, (config) => ({ ...config, stopLogicMode: e.target.value }));
                                                }}
                                            >
                                                <Radio.Button value="AND">满足所有条件</Radio.Button>
                                                <Radio.Button value="OR">满足任一条件</Radio.Button>
                                            </Radio.Group>
                                        )}
                                        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => startInlineCond('stop')}>
                                            新增条件
                                        </Button>
                                    </Space>
                                </div>
                                <Table
                                    rowKey="id"
                                    dataSource={[
                                        ...(inlineCondTarget === 'stop' && inlineCondMode === 'add' ? [{ id: '__new__' }] : []),
                                        ...panelConfig!.stopConditions,
                                    ] as StartStopCondition[]}
                                    columns={buildCondColumns('stop')}
                                    size="small"
                                    pagination={false}
                                    scroll={{ x: 'max-content' }}
                                    locale={{ emptyText: '暂无停机条件，请点击「新增条件」添加' }}
                                    rowClassName={(record) => record.id === '__new__' ? 'dtm-inline-editing-row' : ''}
                                />
                            </div>

                            {/* 消息推送 */}
                            <div data-annotation-id="ssc-push-policies">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Space>
                                        <BellOutlined style={{ color: '#1677ff', fontSize: 16 }} />
                                        <Text strong>消息推送</Text>
                                    </Space>
                                    <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => startInlinePush()}>
                                        新增策略
                                    </Button>
                                </div>
                                <Table
                                    rowKey="id"
                                    dataSource={[
                                        ...(inlinePushMode === 'add' ? [{ id: '__new__' }] : []),
                                        ...panelConfig!.pushPolicies,
                                    ] as PushPolicy[]}
                                    columns={pushColumns}
                                    size="small"
                                    pagination={false}
                                    scroll={{ x: 'max-content' }}
                                    locale={{ emptyText: '暂无推送策略，请点击「新增策略」添加' }}
                                    rowClassName={(record) => record.id === '__new__' ? 'dtm-inline-editing-row' : ''}
                                />
                            </div>
                            </>
                            )}
                        </Card>
                    )}
                </div>
            </div>

            {/* ===== 新增节点 Modal ===== */}
            <Modal
                title="选择工序设备"
                open={addModalOpen}
                onOk={handleAddSubmit}
                onCancel={() => setAddModalOpen(false)}
                destroyOnHidden
                width={520}
            >
                <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    placeholder="搜索工序或设备"
                    value={treeSearch}
                    onChange={(e) => setTreeSearch(e.target.value)}
                    style={{ marginBottom: 12 }}
                />
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    勾选需要添加的工序或设备。勾选工序会自动添加其下所有设备，已添加的内容会自动去重。
                </Text>
                <Tree
                    treeData={(equipmentTreeData as TreeDataNode[])
                        .map((proc) => ({
                            ...proc,
                            children: proc.children?.filter(
                                (eq) => !treeSearch || (eq.title as string).toLowerCase().includes(treeSearch.toLowerCase()) || (proc.title as string).toLowerCase().includes(treeSearch.toLowerCase())
                            ),
                        }))
                        .filter((proc) => proc.children && proc.children.length > 0)}
                    checkable
                    checkStrictly
                    checkedKeys={checkedKeys}
                    onCheck={(keys) => {
                        // checkStrictly 模式下 keys 可能是 { checked, halfChecked } 对象
                        const checked = Array.isArray(keys) ? keys : (keys as { checked: React.Key[] }).checked;
                        setCheckedKeys(checked);
                    }}
                    defaultExpandAll
                    style={{ maxHeight: 400, overflow: 'auto' }}
                />
            </Modal>

            {/* ===== 变量选择 Modal ===== */}
            <Modal
                title="选择变量"
                open={varModalOpen}
                onCancel={() => setVarModalOpen(false)}
                footer={[
                    <Button key="cancel" onClick={() => setVarModalOpen(false)}>
                        取消
                    </Button>,
                    <Button key="ok" type="primary" onClick={confirmVarSelect}>
                        确认
                    </Button>,
                ]}
                destroyOnHidden
                width={860}
            >
                {/* 搜索区 */}
                <Space style={{ marginBottom: 12 }}>
                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="请输入测点名称、编码或自定义编码"
                        value={varSearch}
                        onChange={(e) => setVarSearch(e.target.value)}
                        style={{ width: 260 }}
                    />
                    <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        onClick={() => {
                            // 搜索已在输入时实时过滤，此处仅触发一次过滤刷新
                            setVarSearch((v) => v);
                        }}
                    >
                        搜索
                    </Button>
                    <Button icon={<RedoOutlined />} onClick={() => setVarSearch('')}>
                        重置
                    </Button>
                </Space>

                {/* 变量表格 */}
                <Table<MeasurePoint>
                    rowKey="id"
                    dataSource={varTableData}
                    size="small"
                    rowSelection={{
                        type: 'radio',
                        selectedRowKeys: varTempSelectedKeys,
                        onChange: (keys) => setVarTempSelectedKeys(keys),
                    }}
                    columns={[
                        { title: '测点名称', dataIndex: 'name', ellipsis: true },
                        { title: '测点编码', dataIndex: 'code', width: 130, ellipsis: true },
                        { title: '自定义编码', dataIndex: 'customCode', width: 190, ellipsis: true },
                        { title: '测点类型', dataIndex: 'type', width: 90 },
                        { title: '主设备', dataIndex: 'mainEquipment', width: 100, render: (v: string) => v || '-' },
                        { title: '车间工段', dataIndex: 'workshop', width: 100 },
                    ]}
                    pagination={{
                        size: 'small',
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `共${total}条`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        defaultPageSize: 10,
                    }}
                    scroll={{ y: 300 }}
                />

                {/* 已选内容 */}
                {varTempSelectedKeys.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                        <Text type="secondary">已选择{varTempSelectedKeys.length}项：</Text>
                        <Space size={4} wrap style={{ marginTop: 4 }}>
                            {varTempSelectedKeys.map((k) => {
                                const mp = measurePointList.find((m) => m.id === String(k));
                                return (
                                    <Tag
                                        key={String(k)}
                                        closable
                                        onClose={() => {
                                            setVarTempSelectedKeys((prev) => prev.filter((x) => x !== k));
                                        }}
                                    >
                                        {mp ? mp.name : String(k)}
                                    </Tag>
                                );
                            })}
                        </Space>
                    </div>
                )}
            </Modal>

            {/* ===== 人员选择 Modal（接收人，多选） ===== */}
            <Modal
                title="选择接收人"
                open={personModalOpen}
                onCancel={() => setPersonModalOpen(false)}
                onOk={confirmPersonSelect}
                okText="确认"
                cancelText="取消"
                width={800}
                styles={{ body: { padding: '16px 24px' } }}
                destroyOnHidden
            >
                <div style={{ display: 'flex', minHeight: 360, maxHeight: 420, overflow: 'hidden' }}>
                    {/* 左栏：角色/用户 Tab（关键词筛选已分别放入各 Tab 内） */}
                    <div style={{ flex: '55 1 0%', paddingRight: 16, display: 'flex', flexDirection: 'column' }}>
                        <Tabs
                            activeKey={personModalTab}
                            onChange={(k) => setPersonModalTab(k as 'role' | 'user')}
                            items={[
                                {
                                    key: 'role',
                                    label: '角色',
                                    children: (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <Input
                                                allowClear
                                                placeholder="搜索角色"
                                                prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />}
                                                value={roleSearch}
                                                onChange={(e) => setRoleSearch(e.target.value)}
                                                style={{ marginBottom: 12 }}
                                            />
                                            <div style={{ overflowY: 'auto', maxHeight: 268 }}>
                                            {filteredRoles.map((role) => {
                                                const checked = tempSelectedPersons.includes(role);
                                                return (
                                                    <div
                                                        key={role}
                                                        onClick={() => togglePerson(role)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 8,
                                                            height: 32,
                                                            paddingLeft: 8,
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
                                                            onChange={() => togglePerson(role)}
                                                        />
                                                        <span>{role}</span>
                                                    </div>
                                                );
                                            })}
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    key: 'user',
                                    label: '用户',
                                    children: (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <Input
                                                allowClear
                                                placeholder="搜索人员"
                                                prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />}
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                                style={{ marginBottom: 12 }}
                                            />
                                            <div style={{ overflowY: 'auto', maxHeight: 268 }}>
                                            {renderPersonTreeNodes(filteredPersonTree, 0)}
                                            </div>
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </div>
                    {/* 右栏：已选择项（角色/用户分色显示，可逐个移除） */}
                    <div
                        style={{
                            flex: '45 1 0%',
                            paddingLeft: 16,
                            borderLeft: '1px solid #f0f0f0',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: 13,
                                marginBottom: 8,
                            }}
                        >
                            <span>已选择（{tempSelectedPersons.length}）</span>
                            {tempSelectedPersons.length > 0 && (
                                <a onClick={() => setTempSelectedPersons([])}>清空</a>
                            )}
                        </div>
                        <Space size={4} wrap>
                            {tempSelectedPersons.map((name) => {
                                const isRole = isRoleTitle(name);
                                return (
                                    <Tag
                                        key={name}
                                        closable
                                        onClose={() => togglePerson(name)}
                                        color={isRole ? 'blue' : 'green'}
                                        bordered
                                    >
                                        {name}
                                    </Tag>
                                );
                            })}
                        </Space>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
