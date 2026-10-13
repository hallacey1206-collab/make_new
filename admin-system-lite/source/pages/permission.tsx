import React, { useState } from 'react';
import {
    Save,
    Plus,
    Trash2,
    Edit,
    Copy,
    Download as DownloadIcon,
    Upload as UploadIcon,
} from 'lucide-react';
import {
    Tabs,
    Button,
    Input,
    Modal,
    Tag,
    Table,
    Space,
    Radio,
    Form,
    Row,
    Col,
    Select,
    Popconfirm,
    message,
    InputNumber,
    Upload,
    Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface MenuItem {
    id: string;
    name: string;
    route: string;
    code: string;
    alias: string;
    enabled: boolean;
    sort: number;
    parentId?: string;
    icon?: string;
    type?: string;
    newWindow?: boolean;
    external?: boolean;
    remark?: string;
    children?: MenuItem[];
}

/** 菜单导入时从 CSV 文件中识别出的一条记录 */
interface MenuImportRow {
    name: string;
    route: string;
    code: string;
    alias: string;
    enabled: boolean;
    sort: number;
    /** 上级菜单名称，用于导入时自动挂载 */
    parentName: string;
}

const initialMenuData: MenuItem[] = [
    { id: '1', name: '驾驶舱', route: '/gongmao', code: 'large_screen', alias: '驾驶舱', enabled: false, sort: 0 },
    { id: '2', name: '大屏轮播', route: '/largeScreenCarousel/index', code: 'largeScreenCarousel', alias: '大屏轮播', enabled: true, sort: 1 },
    { id: '3', name: '大屏轮播', route: '/largeScreenCarouselComponent/index?code=SCENE_20250616_03', code: 'SCENE_20250616_03', alias: 'SCENE_20250616_03', enabled: false, sort: 3 },
    {
        id: '4', name: '工厂大屏', route: '/LargeScreen', code: 'LargeScreen', alias: '工厂大屏', enabled: false, sort: 4,
        children: [
            { id: '4-1', name: '工作台', route: '/desk', code: 'desk', alias: '工作台', enabled: false, sort: 1 },
            { id: '4-2', name: '生产监视', route: '/base01', code: 'base001', alias: '生产监视', enabled: false, sort: 2 },
            { id: '4-3', name: '远程辅助巡检', route: '/newRemoteInspection', code: 'newRemoteInspection_PC', alias: 'newRemoteInspection', enabled: false, sort: 2 },
            { id: '4-4', name: '生产管理', route: '/pm', code: '/pm', alias: '生产管理', enabled: false, sort: 3 },
            { id: '4-5', name: '设备管理', route: '/equipment', code: 'equipment', alias: '设备管理', enabled: false, sort: 3 },
            { id: '4-6', name: '质量管理', route: 'qm', code: 'qm', alias: '质量管理', enabled: false, sort: 4 },
        ],
    },
    { id: '5', name: '视频监控', route: 'https://212.126.96.90/#/dHNUYWlI...', code: 'videoSurveillance', alias: '视频监控', enabled: false, sort: 6 },
];

export default function PermissionPage() {
    const [activeTab, setActiveTab] = useState('function');
    const [menuData, setMenuData] = useState<MenuItem[]>(initialMenuData);
    const [menuModalOpen, setMenuModalOpen] = useState(false);
    const [menuForm] = Form.useForm();
    const [menuSearchName, setMenuSearchName] = useState('');
    const [menuSearchCode, setMenuSearchCode] = useState('');
    const [menuSearchAlias, setMenuSearchAlias] = useState('');
    // ===== 菜单导入相关状态 =====
    const [menuImportOpen, setMenuImportOpen] = useState(false);
    const [menuImportRows, setMenuImportRows] = useState<MenuImportRow[] | null>(null);
    const [menuImportOverride, setMenuImportOverride] = useState(false);
    const [menuEditingId, setMenuEditingId] = useState<string | null>(null);

    const handleDeleteMenu = (id: string) => {
        const removeById = (items: MenuItem[]): MenuItem[] => {
            return items
                .filter((item) => item.id !== id)
                .map((item) => {
                    if (item.children) {
                        return { ...item, children: removeById(item.children) };
                    }
                    return item;
                });
        };
        setMenuData((prev) => removeById(prev));
        message.success('删除成功');
    };

    // ===== 菜单复制 / 保存 / 导入导出 =====

    /** 在菜单树中查找目标菜单的上级菜单 id */
    const findMenuParentId = (items: MenuItem[], targetId: string, parentId?: string): string | undefined => {
        for (const it of items) {
            if (it.id === targetId) return parentId;
            if (it.children) {
                const found = findMenuParentId(it.children, targetId, it.id);
                if (found !== undefined) return found;
            }
        }
        return undefined;
    };

    /** 复制菜单：打开菜单新增弹窗，并预填充所选菜单的信息 */
    const handleCopyMenu = (record: MenuItem) => {
        const parentId = findMenuParentId(menuData, record.id);
        menuForm.resetFields();
        menuForm.setFieldsValue({
            name: record.name,
            route: record.route,
            code: record.code,
            alias: record.alias,
            enabled: record.enabled,
            sort: record.sort,
            icon: record.icon,
            type: record.type || 'menu',
            remark: record.remark,
            newWindow: record.newWindow ? 'yes' : 'no',
            external: record.external ? 'yes' : 'no',
            parentId,
        });
        setMenuEditingId(null);
        setMenuModalOpen(true);
    };

    /** 编辑菜单：打开菜单弹窗并预填充所选菜单的信息 */
    const handleEditMenu = (record: MenuItem) => {
        const parentId = findMenuParentId(menuData, record.id);
        menuForm.resetFields();
        menuForm.setFieldsValue({
            name: record.name,
            route: record.route,
            code: record.code,
            alias: record.alias,
            enabled: record.enabled,
            sort: record.sort,
            icon: record.icon,
            type: record.type || 'menu',
            remark: record.remark,
            newWindow: record.newWindow ? 'yes' : 'no',
            external: record.external ? 'yes' : 'no',
            parentId,
        });
        setMenuEditingId(record.id);
        setMenuModalOpen(true);
    };

    /** 新增子项：打开菜单弹窗并将上级菜单预设为当前菜单 */
    const handleAddChildMenu = (record: MenuItem) => {
        menuForm.resetFields();
        menuForm.setFieldsValue({
            parentId: record.id,
            enabled: true,
            newWindow: 'no',
            external: 'no',
            type: 'menu',
            listType: 'default',
        });
        setMenuEditingId(null);
        setMenuModalOpen(true);
    };

    /** 保存菜单（新增 / 复制 / 编辑场景共用），保存后写入菜单列表 */
    const handleSaveMenu = () => {
        menuForm
            .validateFields()
            .then((values) => {
                const baseItem: MenuItem = {
                    id: menuEditingId ?? `m-${Date.now()}`,
                    name: values.name,
                    route: values.route,
                    code: values.code,
                    alias: values.alias,
                    enabled: values.enabled ?? true,
                    sort: values.sort ?? 0,
                    parentId: values.parentId,
                    icon: values.icon,
                    type: values.type,
                    newWindow: values.newWindow === 'yes',
                    external: values.external === 'yes',
                    remark: values.remark,
                };
                if (menuEditingId) {
                    const updateById = (items: MenuItem[]): MenuItem[] =>
                        items.map((m) => {
                            if (m.id === menuEditingId) {
                                return { ...m, ...baseItem, id: m.id, children: m.children };
                            }
                            if (m.children) return { ...m, children: updateById(m.children) };
                            return m;
                        });
                    setMenuData((prev) => updateById(prev));
                } else if (values.parentId) {
                    setMenuData((prev) => prev.map((m) => (m.id === values.parentId ? { ...m, children: [...(m.children || []), baseItem] } : m)));
                } else {
                    setMenuData((prev) => [...prev, baseItem]);
                }
                message.success('保存成功');
                setMenuModalOpen(false);
                setMenuEditingId(null);
            })
            .catch(() => {
                // 必填校验未通过时 antd 会在表单上自动标红提示，保持弹窗打开即可
            });
    };

    /** 导出当前菜单数据为 CSV 文件（带 BOM，Excel 可直接打开） */
    const handleExportMenus = () => {
        const header = ['菜单名称', '路由地址', '菜单编号', '菜单别名', '是否启用', '菜单排序', '上级菜单'];
        const rows: string[][] = [];
        const flatten = (items: MenuItem[], parentName: string) => {
            items.forEach((it) => {
                rows.push([it.name, it.route, it.code, it.alias, it.enabled ? '是' : '否', String(it.sort), parentName]);
                if (it.children?.length) flatten(it.children, it.name);
            });
        };
        flatten(menuData, '');
        const escapeCsv = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
        const csv = [header, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `菜单数据_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        message.success(`已导出 ${rows.length} 条菜单数据`);
    };

    /** 下载菜单导入模板（.xls 格式） */
    const handleDownloadTemplate = () => {
        const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"></head>
<body>
<table>
<tr><th>菜单名称</th><th>路由地址</th><th>菜单编号</th><th>菜单别名</th><th>是否启用</th><th>菜单排序</th><th>上级菜单</th></tr>
<tr><td>示例菜单</td><td>/demo</td><td>demo</td><td>示例</td><td>是</td><td>1</td><td></td></tr>
</table>
</body>
</html>`;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = '菜单导入模板.xls';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        message.success('模板下载成功');
    };

    /** 解析单行 CSV（支持双引号包裹与转义） */
    const parseCsvLine = (line: string): string[] => {
        const cells: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"') {
                    if (line[i + 1] === '"') {
                        cur += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    cur += ch;
                }
            } else if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                cells.push(cur);
                cur = '';
            } else {
                cur += ch;
            }
        }
        cells.push(cur);
        return cells;
    };

    /** 读取上传的 CSV 文件并识别菜单记录 */
    const handleMenuImportFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const text = String(reader.result || '').replace(/^\uFEFF/, '');
            const lines = text.split(/\r?\n/).filter((l) => l.trim());
            if (lines.length < 2) {
                message.error('文件中没有可导入的菜单数据');
                return;
            }
            const header = parseCsvLine(lines[0]);
            const colIdx = (name: string) => header.indexOf(name);
            const iName = colIdx('菜单名称');
            if (iName < 0) {
                message.error('文件格式不正确：缺少「菜单名称」列');
                return;
            }
            const iRoute = colIdx('路由地址');
            const iCode = colIdx('菜单编号');
            const iAlias = colIdx('菜单别名');
            const iEnabled = colIdx('是否启用');
            const iSort = colIdx('菜单排序');
            const iParent = colIdx('上级菜单');
            const rows: MenuImportRow[] = lines
                .slice(1)
                .map((line) => {
                    const cells = parseCsvLine(line);
                    return {
                        name: (cells[iName] || '').trim(),
                        route: iRoute >= 0 ? (cells[iRoute] || '').trim() : '',
                        code: iCode >= 0 ? (cells[iCode] || '').trim() : '',
                        alias: iAlias >= 0 ? (cells[iAlias] || '').trim() : '',
                        enabled: iEnabled >= 0 ? (cells[iEnabled] || '是').trim() === '是' : true,
                        sort: iSort >= 0 ? Number(cells[iSort]) || 0 : 0,
                        parentName: iParent >= 0 ? (cells[iParent] || '').trim() : '',
                    };
                })
                .filter((r) => r.name);
            if (rows.length === 0) {
                message.error('未识别到有效的菜单记录');
                return;
            }
            setMenuImportRows(rows);
        };
        reader.readAsText(file);
    };

    /** 确认导入：按「上级菜单」列挂载到现有菜单下，未匹配的放顶层 */
    const handleConfirmImportMenus = () => {
        if (!menuImportRows?.length) return;
        const ts = Date.now();
        const pending: { item: MenuItem; parentName: string }[] = menuImportRows.map((r, i) => ({
            item: {
                id: `m-import-${ts}-${i}`,
                name: r.name,
                route: r.route,
                code: r.code,
                alias: r.alias,
                enabled: r.enabled,
                sort: r.sort,
            },
            parentName: r.parentName,
        }));
        const mountedIds = new Set<string>();
        const walk = (items: MenuItem[]): MenuItem[] =>
            items.map((it) => {
                const walked = it.children ? walk(it.children) : undefined;
                const adopted = pending.filter((p) => p.parentName === it.name);
                adopted.forEach((p) => mountedIds.add(p.item.id));
                const children = [...(walked || []), ...adopted.map((p) => p.item)];
                return children.length > 0 ? { ...it, children } : it;
            });
        const nextTree = walk(menuData);
        const topLevels = pending.filter((p) => !mountedIds.has(p.item.id)).map((p) => p.item);
        setMenuData([...nextTree, ...topLevels]);
        message.success(`成功导入 ${pending.length} 条菜单`);
        setMenuImportOpen(false);
        setMenuImportRows(null);
    };

    const menuColumns: ColumnsType<MenuItem> = [
        { title: '菜单名称', dataIndex: 'name', render: (v: string) => <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span> },
        { title: '路由地址', dataIndex: 'route', render: (v: string) => <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>{v}</span> },
        { title: '菜单编号', dataIndex: 'code', render: (v: string) => <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>{v}</span> },
        { title: '菜单别名', dataIndex: 'alias' },
        {
            title: '是否启用',
            dataIndex: 'enabled',
            render: (v: boolean) => <Tag color={v ? 'success' : 'error'} style={{ fontSize: 11 }}>{v ? '是' : '否'}</Tag>,
        },
        { title: '菜单排序', dataIndex: 'sort' },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button type="link" size="small" icon={<Edit size={12} />} onClick={() => handleEditMenu(record)}>编辑</Button>
                    <Button type="link" size="small" icon={<Copy size={12} />} onClick={() => handleCopyMenu(record)}>复制</Button>
                    <Button type="link" size="small" icon={<Plus size={12} />} onClick={() => handleAddChildMenu(record)}>新增子项</Button>
                    <Popconfirm title="确定删除该菜单吗？" onConfirm={() => handleDeleteMenu(record.id)}>
                        <Button type="link" size="small" danger icon={<Trash2 size={12} />}>删除</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const items = [
        {
            key: 'function',
            label: '功能权限',
            children: (
                <div>
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <Button type="primary" icon={<Plus size={14} />} onClick={() => { menuForm.resetFields(); setMenuEditingId(null); setMenuModalOpen(true); }}>新增</Button>
                        <Button icon={<Trash2 size={14} />}>删除</Button>
                        <Button icon={<DownloadIcon size={14} />} onClick={handleExportMenus}>导出</Button>
                        <Button icon={<UploadIcon size={14} />} onClick={() => { setMenuImportRows(null); setMenuImportOpen(true); }}>导入</Button>
                        <div style={{ flex: 1 }} />
                        <Input placeholder="请输入菜单名称" value={menuSearchName} onChange={(e) => setMenuSearchName(e.target.value)} style={{ width: 200 }} allowClear />
                        <Input placeholder="请输入菜单编号" value={menuSearchCode} onChange={(e) => setMenuSearchCode(e.target.value)} style={{ width: 200 }} allowClear />
                        <Input placeholder="请输入菜单别名" value={menuSearchAlias} onChange={(e) => setMenuSearchAlias(e.target.value)} style={{ width: 200 }} allowClear />
                    </div>
                    <div className="admin-card" style={{ padding: 0 }}>
                        <Table rowKey="id" columns={menuColumns} dataSource={menuData} pagination={false} defaultExpandAllRows />
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div data-annotation-id="permission-tabs">
            <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k as any)} items={items} />

            <Modal open={menuModalOpen} title={menuEditingId ? '菜单编辑' : '菜单新增'} onCancel={() => { setMenuModalOpen(false); setMenuEditingId(null); }} width={900} footer={null} forceRender>
                <Form form={menuForm} layout="vertical">
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="name" label="菜单名称" rules={[{ required: true, message: '请输入菜单名称' }]}>
                                <Input placeholder="请输入菜单名称" maxLength={500} showCount />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="route" label="路由地址" rules={[{ required: true, message: '请输入路由地址' }]}>
                                <Input placeholder="请输入路由地址" maxLength={500} showCount />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="parentId" label="上级菜单">
                                <Select placeholder="请选择上级菜单" allowClear>
                                    <Select.Option value="4">工厂大屏</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="icon" label="菜单图标">
                                <Input placeholder="请选择菜单图标" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="code" label="菜单编号" rules={[{ required: true, message: '请输入菜单编号' }]}>
                                <Input placeholder="请输入菜单编号" maxLength={50} showCount />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="type" label="菜单类型">
                                <Select placeholder="请选择" defaultValue="menu">
                                    <Select.Option value="menu">菜单</Select.Option>
                                    <Select.Option value="button">按钮</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
                                {({ getFieldValue }) => getFieldValue('type') === 'button' ? (
                                    <Form.Item name="buttonType" label="按钮类型" rules={[{ required: true, message: '请选择按钮类型' }]} initialValue="static">
                                        <Select placeholder="请选择">
                                            <Select.Option value="static">静态</Select.Option>
                                            <Select.Option value="dynamic">动态</Select.Option>
                                        </Select>
                                    </Form.Item>
                                ) : null}
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="alias" label="菜单别名" rules={[{ required: true, message: '请输入菜单别名' }]}>
                                <Input placeholder="请输入菜单别名" maxLength={500} showCount />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="newWindow" label="新窗口">
                                <Select placeholder="请选择" defaultValue="no">
                                    <Select.Option value="no">否</Select.Option>
                                    <Select.Option value="yes">是</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="external" label="是否跳转第三方页面">
                                <Select placeholder="请选择" defaultValue="no">
                                    <Select.Option value="no">否</Select.Option>
                                    <Select.Option value="yes">是</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="enabled" label="是否启用" initialValue={true}>
                                <Radio.Group>
                                    <Radio value={true}>是</Radio>
                                    <Radio value={false}>否</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="sort" label="菜单排序" rules={[{ required: true, message: '请输入菜单排序' }]}>
                                <InputNumber placeholder="请输入菜单排序" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="listType" label="菜单列表">
                                <Select placeholder="请选择" defaultValue="default">
                                    <Select.Option value="default">默认类型</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={24}>
                            <Form.Item name="remark" label="菜单备注">
                                <Input.TextArea placeholder="请输入菜单备注" maxLength={500} showCount rows={3} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                        <Button type="primary" icon={<Save size={14} />} onClick={handleSaveMenu}>保存</Button>
                        <Button type="primary" icon={<Save size={14} />}>保存并新增</Button>
                        <Button onClick={() => setMenuModalOpen(false)}>取消</Button>
                    </div>
                </Form>
            </Modal>

            {/* 菜单导入弹窗 */}
            <Modal
                open={menuImportOpen}
                title="导入菜单"
                onCancel={() => { setMenuImportOpen(false); setMenuImportRows(null); }}
                onOk={handleConfirmImportMenus}
                okText="开始导入"
                okButtonProps={{ disabled: !menuImportRows?.length }}
                width={560}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ width: 80, textAlign: 'right', color: 'rgba(0,0,0,0.85)' }}>模板上传：</span>
                    <Upload
                        accept=".xls,.xlsx"
                        maxCount={1}
                        showUploadList={false}
                        beforeUpload={(file) => {
                            if (file.name.toLowerCase().endsWith('.csv')) {
                                handleMenuImportFile(file);
                            } else {
                                setMenuImportRows([{ name: file.name, route: '', code: '', alias: '', enabled: true, sort: 0, parentName: '' }]);
                            }
                            return false;
                        }}
                    >
                        <Button type="primary" icon={<UploadIcon size={14} />}>点击上传</Button>
                    </Upload>
                </div>
                <div style={{ marginLeft: 92, marginBottom: 16, fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>
                    请上传 .xls,.xlsx 标准格式文件
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <span style={{ width: 80, textAlign: 'right', color: 'rgba(0,0,0,0.85)' }}>
                        <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
                        数据覆盖：
                    </span>
                    <span style={{ color: menuImportOverride ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.85)' }}>否</span>
                    <Switch checked={menuImportOverride} onChange={setMenuImportOverride} />
                    <span style={{ color: menuImportOverride ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.45)' }}>是</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 80, textAlign: 'right', color: 'rgba(0,0,0,0.85)' }}>模板下载：</span>
                    <Button type="primary" icon={<DownloadIcon size={14} />} onClick={handleDownloadTemplate}>点击下载</Button>
                </div>
            </Modal>
        </div>
    );
}
