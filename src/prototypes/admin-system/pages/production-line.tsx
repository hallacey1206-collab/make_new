import React, { useState, useRef, useMemo } from 'react';
import {
    Plus,
    Trash2,
    Edit,
    Upload,
    Download,
    GripVertical,
    CheckCircle2,
    XCircle,
    FileSpreadsheet,
} from 'lucide-react';
import {
    Table,
    Button,
    Input,
    Select,
    TreeSelect,
    Modal,
    Form,
    Tag,
    Space,
    Row,
    Col,
    Checkbox,
    Progress,
    message,
    Steps,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { baseOrgData, orgToTreeSelectData, findOrgPathById } from './org-data';

/* ===== 类型定义 ===== */
interface ProcessItem {
    id: string;
    code: string;
    name: string;
    remark: string;
    deletable: boolean; // 是否可删除（无子级、未被使用、未绑定设备）
}

interface WorkshopItem {
    id: string;
    productionLineId: string;
    productionLineName: string;
    orgId: string;
    orgName: string;
    code: string;
    name: string;
    remark: string;
    deletable: boolean;
    children: ProcessItem[];
}

/* ===== 产线字典 ===== */
const productionLineOptions = [
    { value: 'pl1', label: '1号窑生产线' },
    { value: 'pl2', label: '2号窑生产线' },
    { value: 'pl3', label: '3号窑生产线' },
    { value: 'pl4', label: '水泥粉磨线' },
    { value: 'pl5', label: '石灰石破碎线' },
];

const productionLineNameMap: Record<string, string> = {};
productionLineOptions.forEach((p) => { productionLineNameMap[p.value] = p.label; });

/* ===== 初始数据 ===== */
const initialData: WorkshopItem[] = [
    {
        id: 'ws1', productionLineId: 'pl1', productionLineName: '1号窑生产线',
        orgId: '5', orgName: '苏州中材建设有限公司 / 伊拉克区域公司 / DCC水泥厂 / 烧成车间',
        code: 'WS-YL-001', name: '原料工段', remark: '负责原料破碎与预均化',
        deletable: false,
        children: [
            { id: 'p1-1', code: 'PROC-CRUSH', name: '石灰石破碎', remark: '鄂式破碎机破碎石灰石', deletable: false },
            { id: 'p1-2', code: 'PROC-PREHOMO', name: '预均化堆场', remark: '原料预均化', deletable: true },
        ],
    },
    {
        id: 'ws2', productionLineId: 'pl1', productionLineName: '1号窑生产线',
        orgId: '9', orgName: '苏州中材建设有限公司 / 伊拉克区域公司 / DCC水泥厂 / 制成车间',
        code: 'WS-SC-001', name: '烧成工段', remark: '负责熟料烧成',
        deletable: false,
        children: [
            { id: 'p2-1', code: 'PROC-PREHEAT', name: '预热器', remark: '五级旋风预热器', deletable: true },
            { id: 'p2-2', code: 'PROC-KILN', name: '回转窑煅烧', remark: '回转窑高温煅烧', deletable: false },
        ],
    },
    {
        id: 'ws3', productionLineId: 'pl1', productionLineName: '1号窑生产线',
        orgId: '12', orgName: '苏州中材建设有限公司 / 伊拉克区域公司 / DCC水泥厂 / 中控室',
        code: 'WS-ZC-001', name: '制成工段', remark: '水泥粉磨与包装',
        deletable: true,
        children: [],
    },
    {
        id: 'ws4', productionLineId: 'pl2', productionLineName: '2号窑生产线',
        orgId: '4', orgName: '苏州中材建设有限公司 / 伊拉克区域公司 / DCC水泥厂 / 石灰石矿山',
        code: 'WS-YL-002', name: '原料工段', remark: '2号线原料处理',
        deletable: false,
        children: [
            { id: 'p4-1', code: 'PROC-CRUSH2', name: '石灰石破碎', remark: '2号线石灰石破碎', deletable: true },
        ],
    },
];

/* ===== 页面组件 ===== */
export default function ProductionLinePage() {
    /* ---------- 数据状态 ---------- */
    const [data, setData] = useState<WorkshopItem[]>(initialData);
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(initialData.map((w) => w.id)));


    /* ---------- 对话框状态 ---------- */
    // 车间/工段 对话框
    const [workshopModalOpen, setWorkshopModalOpen] = useState(false);
    const [workshopModalMode, setWorkshopModalMode] = useState<'add' | 'edit'>('add');
    const [workshopForm, setWorkshopForm] = useState<Partial<WorkshopItem>>({});
    const [editingWorkshopId, setEditingWorkshopId] = useState<string | null>(null);

    // 工序 对话框
    const [processModalOpen, setProcessModalOpen] = useState(false);
    const [processModalMode, setProcessModalMode] = useState<'add' | 'edit'>('add');
    const [processForm, setProcessForm] = useState<Partial<ProcessItem & { workshopId: string; workshopName: string }>>({});

    // 导入
    const [importOpen, setImportOpen] = useState(false);
    const [importStep, setImportStep] = useState(0); // 0=上传, 1=预览, 2=确认导入
    const [importFile, setImportFile] = useState<File | null>(null);
    const [overwrite, setOverwrite] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);

    /* ---------- 拖拽状态 ---------- */
    const [dragId, setDragId] = useState<string | null>(null);
    const [dragLevel, setDragLevel] = useState<1 | 2 | null>(null);
    const [dragParentId, setDragParentId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [dragOverPos, setDragOverPos] = useState<'before' | 'after' | 'into' | null>(null);
    const dragCounterRef = useRef(0);

    /* ---------- 工具函数 ---------- */

    // 获取全部车间/工段下拉选项
    const workshopSelectOptions = useMemo(() =>
        data.map((w) => ({ value: w.id, label: w.name })),
    [data]);

    /* ---------- 展开/收起 ---------- */
    const toggleExpand = (id: string) => {
        setExpandedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => setExpandedKeys(new Set(data.map((w) => w.id)));
    const collapseAll = () => setExpandedKeys(new Set());


    /* ---------- 拖拽处理 ---------- */
    const handleDragStart = (key: string, level: 1 | 2, parentId: string | null) => (e: React.DragEvent) => {
        setDragId(key);
        setDragLevel(level);
        setDragParentId(parentId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', key);
        // 设置拖拽图像为半透明
        const el = e.currentTarget as HTMLElement;
        requestAnimationFrame(() => {
            el.style.opacity = '0.4';
        });
    };

    const handleDragEnd = () => (e: React.DragEvent) => {
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '1';
        setDragId(null);
        setDragLevel(null);
        setDragParentId(null);
        setDragOverId(null);
        setDragOverPos(null);
        dragCounterRef.current = 0;
    };

    const handleDragOver = (targetKey: string, targetLevel: 1 | 2, isWorkshop: boolean) => (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!dragId || dragId === targetKey) return;

        setDragOverId(targetKey);

        // 自动展开：如果是收起的第一级节点并且悬停在内部区域
        if (targetLevel === 1 && !expandedKeys.has(targetKey)) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const y = e.clientY - rect.top;
            const h = rect.height;
            if (y > h * 0.3 && y < h * 0.7) {
                // 自动展开
                setExpandedKeys((prev) => {
                    const next = new Set(prev);
                    next.add(targetKey);
                    return next;
                });
            }
        }

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const h = rect.height;

        // 判断放置位置
        if (isWorkshop && targetLevel === 1 && dragLevel === 2) {
            // 第二级拖到第一级节点：可以放入（into）
            if (y > h * 0.2 && y < h * 0.8) {
                setDragOverPos('into');
            } else if (y <= h * 0.2) {
                setDragOverPos('before');
            } else {
                setDragOverPos('after');
            }
        } else if (targetLevel === dragLevel) {
            // 同级拖动：排序（before/after）
            setDragOverPos(y < h / 2 ? 'before' : 'after');
        } else {
            setDragOverPos(null);
        }
    };

    const handleDragLeave = () => {
        dragCounterRef.current--;
        if (dragCounterRef.current <= 0) {
            setDragOverId(null);
            setDragOverPos(null);
            dragCounterRef.current = 0;
        }
    };

    const handleDrop = (targetKey: string, targetLevel: 1 | 2, targetParentId: string | null) => (e: React.DragEvent) => {
        e.preventDefault();
        if (!dragId || !dragLevel) return;

        const dropPos = dragOverPos;
        setDragOverId(null);
        setDragOverPos(null);

        if (dragId === targetKey) return;

        setData((prev) => {
            const next = [...prev.map((w) => ({ ...w, children: [...w.children] }))];

            // 找到拖拽源
            let draggedItem: WorkshopItem | ProcessItem | null = null;

            if (dragLevel === 1) {
                const idx = next.findIndex((w) => w.id === dragId);
                if (idx >= 0) {
                    draggedItem = next[idx];
                    next.splice(idx, 1);
                }
            } else {
                for (let i = 0; i < next.length; i++) {
                    const ci = next[i].children.findIndex((c) => c.id === dragId);
                    if (ci >= 0) {
                        draggedItem = next[i].children[ci];
                        next[i].children.splice(ci, 1);
                        break;
                    }
                }
            }

            if (!draggedItem) return prev;

            if (dropPos === 'into' && targetLevel === 1) {
                // 将子节点移入目标父节点
                const targetIdx = next.findIndex((w) => w.id === targetKey);
                if (targetIdx >= 0 && 'code' in draggedItem) {
                    // 只有 ProcessItem 可以移入
                    next[targetIdx].children.push({ ...(draggedItem as ProcessItem), workshopId: targetKey } as any);
                }
            } else if (dropPos === 'before' || dropPos === 'after') {
                if (dragLevel === targetLevel) {
                    if (targetLevel === 1) {
                        // 第一级之间排序
                        let targetIdx = next.findIndex((w) => w.id === targetKey);
                        if (targetIdx < 0) targetIdx = next.length;
                        if (dropPos === 'after') targetIdx++;
                        next.splice(targetIdx, 0, draggedItem as WorkshopItem);
                    } else if (dragParentId === targetParentId) {
                        // 同一父节点下子节点排序
                        const parentIdx = next.findIndex((w) => w.id === targetParentId);
                        if (parentIdx >= 0) {
                            let ti = next[parentIdx].children.findIndex((c) => c.id === targetKey);
                            if (ti < 0) ti = next[parentIdx].children.length;
                            if (dropPos === 'after') ti++;
                            next[parentIdx].children.splice(ti, 0, draggedItem as ProcessItem);
                        }
                    } else if (dragLevel === 2 && targetLevel === 2) {
                        // 拖到不同父节点下
                        const targetParentIdx = next.findIndex((w) => w.id === targetParentId);
                        if (targetParentIdx >= 0) {
                            let ti = next[targetParentIdx].children.findIndex((c) => c.id === targetKey);
                            if (ti < 0) ti = next[targetParentIdx].children.length;
                            if (dropPos === 'after') ti++;
                            next[targetParentIdx].children.splice(ti, 0, draggedItem as ProcessItem);
                        }
                    }
                }
            }

            return next;
        });

        setDragId(null);
        setDragLevel(null);
        setDragParentId(null);
        dragCounterRef.current = 0;
    };

    /* ---------- 车间/工段 CRUD ---------- */
    const openAddWorkshop = () => {
        setWorkshopModalMode('add');
        setEditingWorkshopId(null);
        setWorkshopForm({});
        setWorkshopModalOpen(true);
    };

    const openEditWorkshop = (ws: WorkshopItem) => {
        setWorkshopModalMode('edit');
        setEditingWorkshopId(ws.id);
        setWorkshopForm({
            productionLineId: ws.productionLineId,
            productionLineName: ws.productionLineName,
            orgId: ws.orgId,
            orgName: ws.orgName,
            code: ws.code,
            name: ws.name,
            remark: ws.remark,
        });
        setWorkshopModalOpen(true);
    };

    const handleSaveWorkshop = () => {
        const form = workshopForm;
        if (!form.productionLineId) { message.warning('请选择所属产线'); return; }
        if (!form.code || !form.code.trim()) { message.warning('请输入车间/工段编码'); return; }
        if (!form.name || !form.name.trim()) { message.warning('请输入车间/工段名称'); return; }

        // 判重
        if (workshopModalMode === 'add') {
            const dupCode = data.some((w) => w.code === form.code?.trim());
            const dupName = data.some((w) => w.name === form.name?.trim());
            if (dupCode) { message.warning('车间/工段编码已存在'); return; }
            if (dupName) { message.warning('车间/工段名称已存在'); return; }

            const newWs: WorkshopItem = {
                id: `ws-${Date.now()}`,
                productionLineId: form.productionLineId || '',
                productionLineName: productionLineNameMap[form.productionLineId || ''] || '',
                orgId: form.orgId || '',
                orgName: form.orgName || '',
                code: form.code?.trim() || '',
                name: form.name?.trim() || '',
                remark: form.remark?.trim() || '',
                deletable: true,
                children: [],
            };
            setData([...data, newWs]);
            message.success('新增车间/工段成功');
        } else {
            const dupCode = data.some((w) => w.code === form.code?.trim() && w.id !== editingWorkshopId);
            const dupName = data.some((w) => w.name === form.name?.trim() && w.id !== editingWorkshopId);
            if (dupCode) { message.warning('车间/工段编码已存在'); return; }
            if (dupName) { message.warning('车间/工段名称已存在'); return; }

            setData(data.map((w) =>
                w.id === editingWorkshopId
                    ? {
                        ...w,
                        productionLineId: form.productionLineId || w.productionLineId,
                        productionLineName: productionLineNameMap[form.productionLineId || ''] || w.productionLineName,
                        orgId: form.orgId || w.orgId,
                        orgName: form.orgName || w.orgName,
                        code: form.code?.trim() || '',
                        name: form.name?.trim() || '',
                        remark: form.remark?.trim() || '',
                    }
                    : w,
            ));
            message.success('编辑车间/工段成功');
        }
        setWorkshopModalOpen(false);
    };

    const handleDeleteWorkshop = (wsId: string) => {
        const realWs = data.find((w) => w.id === wsId);
        if (!realWs) return;
        Modal.confirm({
            title: '确认删除',
            content: `确定删除车间/工段「${realWs.name}」吗？${realWs.children.length > 0 ? '该节点下存在工序，不可删除。' : ''}`,
            okText: '确定',
            cancelText: '取消',
            okButtonProps: { danger: true, disabled: !realWs.deletable || realWs.children.length > 0 },
            onOk: () => {
                setData(data.filter((w) => w.id !== wsId));
                message.success('删除成功');
            },
        });
    };

    /* ---------- 工序 CRUD ---------- */
    const openAddProcess = (wsId: string) => {
        const ws = data.find((w) => w.id === wsId);
        if (!ws) return;
        setProcessModalMode('add');
        setProcessForm({
            workshopId: ws.id,
            workshopName: ws.name,
            code: '',
            name: '',
            remark: '',
        });
        setProcessModalOpen(true);
    };

    const openEditProcess = (proc: ProcessItem, wsId: string) => {
        const ws = data.find((w) => w.id === wsId);
        setProcessModalMode('edit');
        setProcessForm({
            id: proc.id,
            workshopId: wsId,
            workshopName: ws?.name || '',
            code: proc.code,
            name: proc.name,
            remark: proc.remark,
        });
        setProcessModalOpen(true);
    };

    const handleSaveProcess = () => {
        const form = processForm;
        if (!form.workshopId) { message.warning('请选择所属车间/工段'); return; }
        if (!form.code || !form.code?.trim()) { message.warning('请输入工序编码'); return; }
        if (!form.name || !form.name?.trim()) { message.warning('请输入工序名称'); return; }

        if (processModalMode === 'add') {
            // 判重
            const allProcesses = data.flatMap((w) => w.children);
            if (allProcesses.some((p) => p.code === form.code?.trim())) {
                message.warning('工序编码已存在'); return;
            }
            if (allProcesses.some((p) => p.name === form.name?.trim())) {
                message.warning('工序名称已存在'); return;
            }

            const newProc: ProcessItem = {
                id: `proc-${Date.now()}`,
                code: form.code?.trim() || '',
                name: form.name?.trim() || '',
                remark: form.remark?.trim() || '',
                deletable: true,
            };
            setData(data.map((w) =>
                w.id === form.workshopId
                    ? { ...w, children: [...w.children, newProc] }
                    : w,
            ));
            message.success('新增工序成功');
        } else {
            const editingId = processForm.id;
            const allProcesses = data.flatMap((w) => w.children);
            const dupCode = allProcesses.some((p: any) => p.code === form.code?.trim() && p.id !== editingId);
            const dupName = allProcesses.some((p: any) => p.name === form.name?.trim() && p.id !== editingId);
            if (dupCode) { message.warning('工序编码已存在'); return; }
            if (dupName) { message.warning('工序名称已存在'); return; }

            setData(data.map((w) => ({
                ...w,
                children: w.children.map((p: any) =>
                    p.id === editingId
                        ? { ...p, workshopId: form.workshopId, code: form.code?.trim(), name: form.name?.trim(), remark: form.remark?.trim() }
                        : p,
                ),
            })));

            // 如果改变了从属关系（切换了车间）
            const editingWsId = processForm.workshopId;
            const originalWsId = data.find((w) => w.children.some((c: any) => c.id === editingId))?.id;
            if (originalWsId && originalWsId !== editingWsId) {
                setData((prev) => {
                    const sourceWs = prev.find((w) => w.id === originalWsId);
                    const targetWs = prev.find((w) => w.id === editingWsId);
                    if (sourceWs && targetWs) {
                        const proc = sourceWs.children.find((c: any) => c.id === editingId);
                        if (proc) {
                            sourceWs.children = sourceWs.children.filter((c: any) => c.id !== editingId);
                            targetWs.children = [...targetWs.children, { ...proc, workshopId: editingWsId } as ProcessItem];
                        }
                    }
                    return [...prev];
                });
            }
            message.success('编辑工序成功');
        }
        setProcessModalOpen(false);
    };

    const handleDeleteProcess = (proc: ProcessItem, wsId: string) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定删除工序「${proc.name}」吗？${!proc.deletable ? '该工序已被使用或已绑定设备，不可删除。' : ''}`,
            okText: '确定',
            cancelText: '取消',
            okButtonProps: { danger: true, disabled: !proc.deletable },
            onOk: () => {
                setData(data.map((w) =>
                    w.id === wsId
                        ? { ...w, children: w.children.filter((c) => c.id !== proc.id) }
                        : w,
                ));
                message.success('删除成功');
            },
        });
    };

    /* ---------- 导入 ---------- */
    const openImport = () => {
        setImportStep(0);
        setImportFile(null);
        setOverwrite(false);
        setImporting(false);
        setImportProgress(0);
        setImportOpen(true);
    };

    const handleDownloadTemplate = () => {
        // 模拟下载模板
        const csvContent = '\uFEFF产线编码,产线名称,车间编码,车间名称,工序编码,工序名称,备注\nPL001,1号窑生产线,WS001,原料工段,PROC001,石灰石破碎,备注信息\n';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '产线配置导入模板.csv';
        a.click();
        URL.revokeObjectURL(url);
        message.success('模板下载成功');
    };

    const handleUploadChange = (file: File) => {
        setImportFile(file);
    };

    const handleGoPreview = () => {
        if (!importFile) {
            message.warning('请先上传文件');
            return;
        }
        setImportStep(1);
    };

    const handleConfirmImport = () => {
        setImportStep(2);
        setImporting(true);
        setImportProgress(0);
        // 模拟导入进度
        const timer = setInterval(() => {
            setImportProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setImporting(false);
                    return 100;
                }
                return prev + Math.floor(Math.random() * 15) + 5;
            });
        }, 300);
    };

    const handleReUpload = () => {
        setImportStep(0);
        setImportFile(null);
    };

    const handleCloseImport = () => {
        if (importing && importProgress < 100) {
            Modal.confirm({
                title: '确认退出',
                content: '导入正在进行中，退出后导入将会中断，确定退出吗？',
                okText: '确定退出',
                cancelText: '继续导入',
                onOk: () => {
                    setImporting(false);
                    setImportProgress(0);
                    setImportOpen(false);
                },
            });
        } else {
            setImportOpen(false);
        }
    };

    /* ---------- 模拟预览数据 ---------- */
    const previewCorrectRows = [
        { key: '1', lineCode: 'PL001', lineName: '1号窑生产线', wsCode: 'WS-YL-001', wsName: '原料工段', procCode: 'PROC-CRUSH', procName: '石灰石破碎', status: 'success' as const },
        { key: '2', lineCode: 'PL001', lineName: '1号窑生产线', wsCode: 'WS-YL-001', wsName: '原料工段', procCode: 'PROC-PREHOMO', procName: '预均化堆场', status: 'success' as const },
    ];
    const previewErrorRows = [
        { key: '3', lineCode: 'PL001', lineName: '1号窑生产线', wsCode: 'WS-SC-001', wsName: '烧成工段', procCode: 'PROC-KILN', procName: '回转窑煅烧', status: 'error' as const, errorMsg: '工序编码已存在' },
    ];

    /* ---------- 表格列定义 ---------- */
    const columns: ColumnsType<any> = [
        {
            title: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Button type="text" size="small" onClick={expandAll} style={{ padding: 0, fontSize: 12 }}>
                        全部展开
                    </Button>
                    <span style={{ color: '#d9d9d9' }}>|</span>
                    <Button type="text" size="small" onClick={collapseAll} style={{ padding: 0, fontSize: 12 }}>
                        全部收起
                    </Button>
                </div>
            ),
            key: 'name',
            width: 280,
            render: (_: any, record: any) => {
                const isWorkshop = record._isWorkshop;
                const isExpanded = isWorkshop && expandedKeys.has(record.id);
                const hasChildren = isWorkshop && record._hasChildren;
                const isDragOver = record.id === dragOverId;
                const indent = isWorkshop ? 0 : 24;

                return (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            paddingLeft: indent,
                            cursor: 'default',
                        }}
                    >
                        {/* 拖拽手柄 */}
                        <span
                            draggable
                            onDragStart={handleDragStart(record.id, record._level, record._parentId)}
                            onDragEnd={handleDragEnd()}
                            style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'rgba(0,0,0,0.25)' }}
                        >
                            <GripVertical size={14} />
                        </span>

                        {/* 展开/收起图标 */}
                        {isWorkshop && (
                            <span
                                onClick={() => toggleExpand(record.id)}
                                style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'transform 0.2s',
                                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                    color: hasChildren ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.15)',
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                    <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                </svg>
                            </span>
                        )}
                        {!isWorkshop && <span style={{ width: 12, flexShrink: 0 }} />}

                        {/* 标签 */}
                        <Tag
                            color={isWorkshop ? 'blue' : 'default'}
                            style={{ fontSize: 11, margin: 0, flexShrink: 0 }}
                        >
                            {isWorkshop ? '车间/工段' : '工序'}
                        </Tag>

                        {/* 名称 */}
                        <span
                            style={{
                                fontWeight: isWorkshop ? 600 : 400,
                                fontSize: 14,
                                borderBottom: isDragOver ? '2px solid #1677ff' : undefined,
                            }}
                        >
                            {record.name}
                        </span>
                    </div>
                );
            },
            onCell: (record: any) => ({
                onDragOver: handleDragOver(
                    record.id,
                    record._level,
                    record._isWorkshop,
                ),
                onDragLeave: handleDragLeave,
                onDrop: handleDrop(record.id, record._level, record._parentId),
                style: {
                    background: record.id === dragOverId && dragOverPos === 'into'
                        ? '#e6f4ff'
                        : undefined,
                    borderTop: record.id === dragOverId && dragOverPos === 'before'
                        ? '2px solid #1677ff'
                        : undefined,
                    borderBottom: record.id === dragOverId && dragOverPos === 'after'
                        ? '2px solid #1677ff'
                        : undefined,
                },
            }),
        },
        {
            title: '编码',
            dataIndex: 'code',
            key: 'code',
            width: 180,
            render: (v: string) => <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>{v}</span>,
        },
        {
            title: '所属产线',
            key: 'parent',
            width: 150,
            render: (_: any, record: any) => {
                if (record._isWorkshop) {
                    return <span style={{ fontSize: 13 }}>{(record as WorkshopItem).productionLineName}</span>;
                }
                return <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.25)' }}>-</span>;
            },
        },
        {
            title: '归属组织',
            key: 'org',
            width: 180,
            render: (_: any, record: any) => {
                if (record._isWorkshop) {
                    return <span style={{ fontSize: 13 }}>{(record as WorkshopItem).orgName || '-'}</span>;
                }
                return <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.25)' }}>-</span>;
            },
        },
        {
            title: '备注',
            dataIndex: 'remark',
            key: 'remark',
            width: 200,
            render: (v: string) => (
                <span style={{ fontSize: 13, color: v ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.25)' }}>
                    {v || '-'}
                </span>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 220,
            render: (_: any, record: any) => {
                if (record._isWorkshop) {
                    const ws = record as WorkshopItem;
                    return (
                        <Space size={4}>
                            <Button
                                type="link"
                                size="small"
                                icon={<Edit size={12} />}
                                onClick={() => openEditWorkshop(ws)}
                            >
                                编辑车间/工段
                            </Button>
                            <Button
                                type="link"
                                size="small"
                                icon={<Plus size={12} />}
                                onClick={() => openAddProcess(ws.id)}
                            >
                                新增工序
                            </Button>
                            {record.deletable && !record._hasChildren && (
                                <Button
                                    type="link"
                                    size="small"
                                    danger
                                    icon={<Trash2 size={12} />}
                                    onClick={() => handleDeleteWorkshop(record.id)}
                                >
                                    删除
                                </Button>
                            )}
                        </Space>
                    );
                }
                // 工序
                const proc = record as ProcessItem;
                const wsId = data.find((w) => w.children.some((c) => c.id === proc.id))?.id || '';
                return (
                    <Space size={4}>
                        <Button
                            type="link"
                            size="small"
                            icon={<Edit size={12} />}
                            onClick={() => openEditProcess(proc, wsId)}
                        >
                            编辑
                        </Button>
                        {proc.deletable && (
                            <Button
                                type="link"
                                size="small"
                                danger
                                icon={<Trash2 size={12} />}
                                onClick={() => handleDeleteProcess(proc, wsId)}
                            >
                                删除
                            </Button>
                        )}
                    </Space>
                );
            },
        },
    ];

    /* ---------- 构建表格数据（扁平化 + 展开过滤） ---------- */
    const tableData = useMemo(() => {
        const rows: any[] = [];
        data.forEach((ws) => {
            const { children, ...wsFields } = ws;
            rows.push({
                ...wsFields,
                key: ws.id,
                _isWorkshop: true,
                _level: 1 as const,
                _parentId: null,
                _hasChildren: ws.children.length > 0,
            });
            if (expandedKeys.has(ws.id)) {
                ws.children.forEach((proc) => {
                    rows.push({
                        ...proc,
                        key: proc.id,
                        _isWorkshop: false,
                        _level: 2 as const,
                        _parentId: ws.id,
                    });
                });
            }
        });
        return rows;
    }, [data, expandedKeys]);

    /* ========== 渲染 ========== */
    return (
        <div>
            {/* 工具栏 */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Button type="primary" icon={<Plus size={14} />} onClick={openAddWorkshop}>
                    新增车间/工段
                </Button>
                <Button icon={<Upload size={14} />} onClick={openImport}>
                    导入
                </Button>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                    提示：拖动行可排序或变更从属关系
                </span>
            </div>

            {/* 树形表格 */}
            <div className="admin-card" style={{ padding: 0 }}>
                <Table
                    rowKey="key"
                    columns={columns}
                    dataSource={tableData}
                    pagination={false}
                    showHeader={true}
                    size="middle"
                />
                {tableData.length === 0 && (
                    <div className="admin-empty">暂无数据，点击「新增车间/工段」添加</div>
                )}
            </div>

            {/* ===== 新增/编辑车间/工段 对话框 ===== */}
            <Modal
                open={workshopModalOpen}
                title={workshopModalMode === 'add' ? '新增车间/工段' : '编辑车间/工段'}
                onCancel={() => setWorkshopModalOpen(false)}
                onOk={handleSaveWorkshop}
                width={600}
                destroyOnClose
            >
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="所属产线" required>
                                <Select
                                    placeholder="请选择所属产线"
                                    value={workshopForm.productionLineId || undefined}
                                    onChange={(v) => setWorkshopForm({
                                        ...workshopForm,
                                        productionLineId: v,
                                        productionLineName: productionLineNameMap[v] || '',
                                    })}
                                    options={productionLineOptions}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="归属组织" required>
                                <TreeSelect
                                    placeholder="请选择归属组织"
                                    treeData={orgToTreeSelectData(baseOrgData)}
                                    value={workshopForm.orgId || undefined}
                                    onChange={(v) => {
                                        const orgName = v ? findOrgPathById(baseOrgData, v) || '' : '';
                                        setWorkshopForm({
                                            ...workshopForm,
                                            orgId: v,
                                            orgName,
                                        });
                                    }}
                                    treeDefaultExpandAll
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="车间/工段编码" required>
                                <Input
                                    placeholder="请输入编码"
                                    maxLength={50}
                                    showCount
                                    value={workshopForm.code || ''}
                                    onChange={(e) => setWorkshopForm({ ...workshopForm, code: e.target.value })}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="车间/工段名称" required>
                                <Input
                                    placeholder="请输入名称"
                                    maxLength={50}
                                    showCount
                                    value={workshopForm.name || ''}
                                    onChange={(e) => setWorkshopForm({ ...workshopForm, name: e.target.value })}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item label="备注信息">
                                <Input.TextArea
                                    placeholder="请输入备注信息"
                                    maxLength={100}
                                    showCount
                                    rows={3}
                                    value={workshopForm.remark || ''}
                                    onChange={(e) => setWorkshopForm({ ...workshopForm, remark: e.target.value })}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* ===== 新增/编辑工序 对话框 ===== */}
            <Modal
                open={processModalOpen}
                title={processModalMode === 'add' ? '新增工序' : '编辑工序'}
                onCancel={() => setProcessModalOpen(false)}
                onOk={handleSaveProcess}
                width={600}
                destroyOnClose
            >
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="所属车间/工段" required>
                                <Select
                                    placeholder="请选择所属车间/工段"
                                    value={processForm.workshopId || undefined}
                                    onChange={(v) => {
                                        const ws = data.find((w) => w.id === v);
                                        setProcessForm({
                                            ...processForm,
                                            workshopId: v,
                                            workshopName: ws?.name || '',
                                        });
                                    }}
                                    options={workshopSelectOptions}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="工序编码" required>
                                <Input
                                    placeholder="请输入工序编码"
                                    maxLength={50}
                                    showCount
                                    value={processForm.code || ''}
                                    onChange={(e) => setProcessForm({ ...processForm, code: e.target.value })}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="工序名称" required>
                                <Input
                                    placeholder="请输入工序名称"
                                    maxLength={50}
                                    showCount
                                    value={processForm.name || ''}
                                    onChange={(e) => setProcessForm({ ...processForm, name: e.target.value })}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item label="备注信息">
                                <Input.TextArea
                                    placeholder="请输入备注信息"
                                    maxLength={100}
                                    showCount
                                    rows={3}
                                    value={processForm.remark || ''}
                                    onChange={(e) => setProcessForm({ ...processForm, remark: e.target.value })}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* ===== 导入对话框 ===== */}
            <Modal
                open={importOpen}
                title="导入产线配置"
                onCancel={handleCloseImport}
                width={800}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        {importStep === 0 && (
                            <>
                                <Button onClick={handleCloseImport}>取消</Button>
                                <Button type="primary" onClick={handleGoPreview}>
                                    下一步
                                </Button>
                            </>
                        )}
                        {importStep === 1 && (
                            <>
                                <Button onClick={handleReUpload}>重新上传</Button>
                                <Button onClick={handleCloseImport}>取消</Button>
                                <Button type="primary" onClick={handleConfirmImport}>
                                    继续导入
                                </Button>
                            </>
                        )}
                        {importStep === 2 && (
                            <>
                                <Button onClick={handleCloseImport} disabled={importing && importProgress < 100}>
                                    {importing ? '导入中...' : '关闭'}
                                </Button>
                            </>
                        )}
                    </div>
                }
                destroyOnClose
            >
                {/* 步骤指示器 */}
                <Steps
                    current={importStep}
                    size="small"
                    style={{ marginBottom: 24 }}
                    items={[
                        { title: '上传文件' },
                        { title: '数据预览' },
                        { title: '确认导入' },
                    ]}
                />

                {/* Step 0: 上传文件 */}
                {importStep === 0 && (
                    <div>
                        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Button icon={<Download size={14} />} onClick={handleDownloadTemplate}>
                                下载导入模板
                            </Button>
                            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>
                                请先下载模板，按模板格式填写数据后上传
                            </span>
                        </div>

                        <div
                            style={{
                                border: '2px dashed #d9d9d9',
                                borderRadius: 8,
                                padding: 40,
                                textAlign: 'center',
                                background: '#fafafa',
                                cursor: 'pointer',
                                transition: 'border-color 0.3s',
                            }}
                            onDragOver={(e) => { e.preventDefault(); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (file) handleUploadChange(file);
                            }}
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.csv,.xlsx,.xls';
                                input.onchange = (e: any) => {
                                    const file = e.target?.files?.[0];
                                    if (file) handleUploadChange(file);
                                };
                                input.click();
                            }}
                        >
                            <FileSpreadsheet size={40} style={{ color: '#1677ff', marginBottom: 12 }} />
                            <div style={{ fontSize: 14, marginBottom: 4 }}>
                                {importFile ? (
                                    <span style={{ color: '#1677ff', fontWeight: 600 }}>{importFile.name}</span>
                                ) : (
                                    <span>点击或拖拽文件到此区域上传</span>
                                )}
                            </div>
                            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                                支持 .csv、.xlsx 格式
                            </div>
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <Checkbox checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)}>
                                数据覆盖（开启后，发现重复数据将更新该条数据；未开启则跳过重复数据）
                            </Checkbox>
                        </div>
                    </div>
                )}

                {/* Step 1: 数据预览 */}
                {importStep === 1 && (
                    <div>
                        <div style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
                            数据预览 — 共 {previewCorrectRows.length + previewErrorRows.length} 条，
                            <span style={{ color: '#52c41a' }}>正确 {previewCorrectRows.length} 条</span>，
                            <span style={{ color: '#ff4d4f' }}>错误 {previewErrorRows.length} 条</span>
                        </div>

                        {/* 正确数据 */}
                        {previewCorrectRows.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#52c41a', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCircle2 size={14} /> 正确数据
                                </div>
                                <Table
                                    size="small"
                                    pagination={false}
                                    dataSource={previewCorrectRows}
                                    columns={[
                                        { title: '产线编码', dataIndex: 'lineCode', width: 100 },
                                        { title: '产线名称', dataIndex: 'lineName', width: 120 },
                                        { title: '车间编码', dataIndex: 'wsCode', width: 120 },
                                        { title: '车间名称', dataIndex: 'wsName', width: 100 },
                                        { title: '工序编码', dataIndex: 'procCode', width: 120 },
                                        { title: '工序名称', dataIndex: 'procName', width: 120 },
                                    ]}
                                />
                            </div>
                        )}

                        {/* 错误数据 */}
                        {previewErrorRows.length > 0 && (
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#ff4d4f', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <XCircle size={14} /> 错误数据（将跳过）
                                </div>
                                <Table
                                    size="small"
                                    pagination={false}
                                    dataSource={previewErrorRows}
                                    columns={[
                                        { title: '产线编码', dataIndex: 'lineCode', width: 100 },
                                        { title: '产线名称', dataIndex: 'lineName', width: 120 },
                                        { title: '车间编码', dataIndex: 'wsCode', width: 120 },
                                        { title: '车间名称', dataIndex: 'wsName', width: 100 },
                                        { title: '工序编码', dataIndex: 'procCode', width: 120 },
                                        { title: '工序名称', dataIndex: 'procName', width: 120 },
                                        {
                                            title: '错误原因',
                                            dataIndex: 'errorMsg',
                                            render: (v: string) => <Tag color="error">{v}</Tag>,
                                        },
                                    ]}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: 确认导入 */}
                {importStep === 2 && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        {importing && importProgress < 100 ? (
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
                                    正在导入...
                                </div>
                                <Progress
                                    percent={importProgress}
                                    status="active"
                                    strokeColor={{ from: '#1677ff', to: '#52c41a' }}
                                />
                                <div style={{ marginTop: 16, fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>
                                    请耐心等待，不要关闭窗口
                                </div>
                            </div>
                        ) : (
                            <div>
                                <CheckCircle2 size={48} style={{ color: '#52c41a', marginBottom: 16 }} />
                                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                                    导入完成！
                                </div>
                                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>
                                    成功导入 2 条数据，跳过 1 条错误数据
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
