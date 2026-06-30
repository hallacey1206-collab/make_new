import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    LeftOutlined,
    RightOutlined,
} from '@ant-design/icons';
import {
    AccountBookOutlined,
    AppstoreOutlined,
    ArrowUpOutlined,
    BookOutlined,
    BranchesOutlined,
    BellOutlined,
    CheckCircleOutlined,
    CloudDownloadOutlined,
    CloudUploadOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    DeleteOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    ExperimentOutlined,
    FolderOpenOutlined,
    CloseOutlined,
    HomeOutlined,
    InfoCircleOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    EllipsisOutlined,
    ProjectOutlined,
    ReloadOutlined,
    SaveOutlined,
    ScheduleOutlined,
    SearchOutlined,
    ShoppingOutlined,
    TeamOutlined,
    TrophyOutlined,
} from '@ant-design/icons';
import {
    Alert,
    App,
    Badge,
    Button,
    Card,
    Checkbox,
    Col,
    ConfigProvider,
    Descriptions,
    Divider,
    Drawer,
    Form,
    Input,
    InputNumber,
    Layout,
    Menu,
    Modal,
    Progress,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Timeline,
    Tree,
    Typography,
    message,
} from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TreeDataNode } from 'antd';
import { defineHashPageRoute, useHashPage } from '../../common/useHashPage';
import {
    accountingOptions,
    buildModeOptions,
    buildTypeOptions,
    businessDomainOptions,
    companyOptions,
    currentPlanYear,
    initialPlanRecords,
    menuGroups,
    orgTreeData,
    pageMeta,
    pageOrder,
    planYearOptions,
    policyDirectionOptions,
    projectCategoryOptions,
    yesNoOptions,
    getNextPlanCode,
    type MenuPageId,
    type PlatformPlanRecord,
    type PlanStatus,
} from './data';
import FilingManagementPage from './filing-management';
import ExpertDatabasePage, { ExpertStoreProvider } from './expert-database';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

type StoreContextValue = {
    records: PlatformPlanRecord[];
    saveDraft: (record: PlatformPlanRecord) => void;
    deleteDraft: (id: string) => void;
    submitDrafts: () => void;
    approvePlan: (id: string, remark?: string) => void;
    returnPlan: (id: string, remark: string) => void;
};

const PlatformStoreContext = createContext<StoreContextValue | null>(null);

const route = defineHashPageRoute(pageOrder.map((id) => ({
    id,
    title: pageMeta[id].title,
})), {
    defaultPageId: 'home',
});

const menuIconMap: Record<string, React.ReactNode> = {
    overview: <HomeOutlined />,
    plan: <ScheduleOutlined />,
    budget: <AccountBookOutlined />,
    project: <ProjectOutlined />,
    supplier: <TeamOutlined />,
    resource: <FolderOpenOutlined />,
};

const statusMeta: Record<PlanStatus, { label: string; color: string }> = {
    draft: { label: '草稿', color: 'default' },
    'pending-review': { label: '待审核', color: 'processing' },
    approved: { label: '通过', color: 'success' },
    returned: { label: '退回', color: 'error' },
};

const pageGroupOpenKeyMap: Record<MenuPageId, string> = {
    home: 'home',
    'plan-fill': 'plan',
    'plan-review': 'plan',
    'plan-view': 'plan',
    'budget-fill': 'budget',
    'budget-view': 'budget',
    'budget-review': 'budget',
    'budget-stat': 'budget',
    'budget-plan-fill': 'budget',
    'budget-plan-view': 'budget',
    'budget-execution-fill': 'budget',
    'budget-execution-stat': 'budget',
    'project-filing': 'project',
    'project-execution': 'project',
    'filing-management': 'project',
    'execution-management': 'project',
    'project-change': 'project',
    'change-management': 'project',
    'project-post-eval': 'project',
    'post-eval-management': 'project',
    'supplier-eval': 'project',
    'expert-database': 'resource',
    'resource-sharing': 'resource',
};

function nowString() {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function formatMoney(value: number) {
    return value.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(value?: string) {
    if (!value) {
        return '-';
    }
    return value.slice(0, 10);
}

function getPlanTotal(record: PlatformPlanRecord) {
    return record.selfFunding + record.externalFunding + record.otherFunding;
}

function getTechTotal(record: PlatformPlanRecord) {
    return record.softwareFunding + record.hardwareFunding + record.otherTechFunding;
}

function normalizeSelectedKeys(value: string | string[] | undefined) {
    if (typeof value === 'string') {
        return [value];
    }
    return Array.isArray(value) ? value : [];
}

function findFirstLeafKey(nodes: TreeDataNode[]): string {
    for (const node of nodes) {
        if (node.children && node.children.length > 0) {
            const childKey = findFirstLeafKey(node.children as TreeDataNode[]);
            if (childKey) {
                return childKey;
            }
        } else if (typeof node.key === 'string') {
            return node.key;
        }
    }
    return 'group';
}

function downloadTextFile(filename: string, content: string) {
    if (typeof document === 'undefined') {
        return;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function buildCsv(records: PlatformPlanRecord[]) {
    const header = ['计划编码', '计划名称', '单位', '项目类别', '业务域分类', '状态', '投资总额', '提交时间', '审核时间'];
    const rows = records.map((record) => [
        record.code,
        record.name,
        record.unitName,
        record.category,
        record.domain,
        statusMeta[record.status].label,
        String(getPlanTotal(record)),
        record.submitTime || '',
        record.reviewTime || '',
    ]);
    return [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
}

function buildPlanColumns({
    onEdit,
    onDelete,
    onCopy,
    onSubmit,
    canSubmit,
}: {
    onEdit: (record: PlatformPlanRecord) => void;
    onDelete: (record: PlatformPlanRecord) => void;
    onSubmit?: (record: PlatformPlanRecord) => void;
    canSubmit?: boolean;
}): ColumnsType<PlatformPlanRecord> {
    return [
        { title: '计划编码', dataIndex: 'code', width: 110 },
        {
            title: '计划名称',
            dataIndex: 'name',
            width: 160,
            ellipsis: true,
        },
        {
            title: '项目类别',
            dataIndex: 'category',
            width: 150,
            ellipsis: true,
        },
        {
            title: '投资总额(万元)',
            width: 120,
            render: (_, record) => `¥ ${formatMoney(getPlanTotal(record))}`,
        },
        {
            title: '状态',
            width: 90,
            render: (_, record) => <Tag color={statusMeta[record.status].color}>{statusMeta[record.status].label}</Tag>,
        },
        {
            title: '更新时间',
            dataIndex: 'updatedAt',
            width: 140,
        },
        {
            title: '操作',
            width: 140,
            render: (_, record) => (
                <Space size={4} wrap>
                    <Button size="small" type="link" icon={<EditOutlined />} onClick={() => onEdit(record)}>
                        编辑
                    </Button>
                    {canSubmit && onSubmit ? (
                        <Button size="small" type="link" icon={<ArrowUpOutlined />} onClick={() => onSubmit(record)}>
                            提交
                        </Button>
                    ) : null}
                    <Button size="small" type="link" danger icon={<DeleteOutlined />} onClick={() => onDelete(record)}>
                        删除
                    </Button>
                </Space>
            ),
        },
    ];
}

function usePlatformStore() {
    const store = useContext(PlatformStoreContext);
    if (!store) {
        throw new Error('Platform store is missing.');
    }
    return store;
}

function PlatformStoreProvider({ children }: { children: React.ReactNode }) {
    const [records, setRecords] = useState<PlatformPlanRecord[]>(initialPlanRecords);

    const saveDraft = (record: PlatformPlanRecord) => {
        setRecords((current) => {
            const next = current.filter((item) => item.id !== record.id);
            return [record, ...next].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        });
    };

    const deleteDraft = (id: string) => {
        setRecords((current) => current.filter((item) => item.id !== id));
    };

    const submitDrafts = () => {
        setRecords((current) => current.map((item) => {
            if (item.status === 'draft' || item.status === 'returned') {
                return {
                    ...item,
                    status: 'pending-review',
                    submitTime: nowString(),
                    reviewer: undefined,
                    reviewTime: undefined,
                    reviewRemark: undefined,
                    updatedAt: nowString(),
                };
            }
            return item;
        }));
        message.success('投资计划已批量提交，已进入审核流程。');
    };

    const approvePlan = (id: string, remark?: string) => {
        setRecords((current) => current.map((item) => (
            item.id === id
                ? {
                    ...item,
                    status: 'approved',
                    reviewer: '李审核',
                    reviewTime: nowString(),
                    reviewRemark: remark || '同意通过。',
                    updatedAt: nowString(),
                }
                : item
        )));
        message.success('已通过审核。');
    };

    const returnPlan = (id: string, remark: string) => {
        setRecords((current) => current.map((item) => (
            item.id === id
                ? {
                    ...item,
                    status: 'returned',
                    reviewer: '李审核',
                    reviewTime: nowString(),
                    reviewRemark: remark,
                    updatedAt: nowString(),
                }
                : item
        )));
        message.success('已退回并同步回填报列表。');
    };

    const value = useMemo(() => ({
        records,
        saveDraft,
        deleteDraft,
        submitDrafts,
        approvePlan,
        returnPlan,
    }), [records]);

    return (
        <PlatformStoreContext.Provider value={value}>
            {children}
        </PlatformStoreContext.Provider>
    );
}

function PageHero({
    extra,
}: {
    pageId?: MenuPageId;
    extra?: React.ReactNode;
    showSummary?: boolean;
}) {
    if (!extra) {
        return null;
    }
    return (
        <div className="dmp-hero-actions" style={{ marginBottom: 16, textAlign: 'right' }}>
            {extra}
        </div>
    );
}

function OverviewPage() {
    const { records } = usePlatformStore();
    const { setPage } = useHashPage(route);
    const totals = useMemo(() => {
        const draft = records.filter((item) => item.status === 'draft' || item.status === 'returned');
        const pending = records.filter((item) => item.status === 'pending-review');
        const approved = records.filter((item) => item.status === 'approved');
        const totalAmount = records.reduce((sum, item) => sum + getPlanTotal(item), 0);
        return { draft, pending, approved, totalAmount };
    }, [records]);

    const menuCoverage = menuGroups.map((group) => ({
        group: group.title,
        count: group.children.length,
        firstPage: group.children[0]?.title || '-',
    }));

    return (
        <div className="dmp-page-stack">
            <PageHero
                pageId="overview"
                extra={(
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={() => message.info('总览数据已刷新。')}>刷新</Button>
                        <Button type="primary" icon={<DashboardOutlined />} onClick={() => setPage('plan-fill')}>跳转计划管理</Button>
                    </Space>
                )}
            />

            <Row gutter={16}>
                <Col xs={24} md={12} xl={6}><Card><Statistic title="待提交计划" value={totals.draft.length} prefix={<EditOutlined />} /></Card></Col>
                <Col xs={24} md={12} xl={6}><Card><Statistic title="待审核计划" value={totals.pending.length} prefix={<ScheduleOutlined />} /></Card></Col>
                <Col xs={24} md={12} xl={6}><Card><Statistic title="已通过计划" value={totals.approved.length} prefix={<CheckCircleOutlined />} /></Card></Col>
                <Col xs={24} md={12} xl={6}><Card><Statistic title="年度投资总额" value={totals.totalAmount} precision={2} prefix="¥" /></Card></Col>
            </Row>

            <Row gutter={16}>
                <Col xs={24} lg={14}>
                    <Card
                        title="计划管理流程"
                        extra={<Tag color="blue">围绕填报-审核-查看-统计闭环</Tag>}
                    >
                        <Timeline
                            items={[
                                { children: '企业逐条填报或通过模板导入投资计划。' },
                                { children: '提交后进入审核队列，按组织树逐单位查看。' },
                                { children: '审核通过后同步到查看和统计页面。' },
                                { children: '预算模块可在后续页面直接引用通过的计划。' },
                            ]}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card title="菜单覆盖情况">
                        <Space direction="vertical" style={{ width: '100%' }} size={12}>
                            {menuCoverage.map((item) => (
                                <Card key={item.group} size="small" className="dmp-mini-card">
                                    <div className="dmp-mini-card-row">
                                        <Text strong>{item.group}</Text>
                                        <Tag>{item.count} 个页面</Tag>
                                    </div>
                                    <Text type="secondary">首个入口：{item.firstPage}</Text>
                                </Card>
                            ))}
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Card title="业务联动说明">
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Alert
                            message="计划管理"
                            description="本次原型重点实现投资计划填报、审核、查看与统计四个页面，字段、流程和状态已按文档落地。"
                            type="info"
                            showIcon
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <Alert
                            message="预算管理"
                            description="后续预算模块建议直接引用审核通过的计划数据，减少重复录入并保持口径一致。"
                            type="warning"
                            showIcon
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <Alert
                            message="项目管理"
                            description="项目备案、执行和变更页面可以复用同一后台壳与组织树，保证平台体验统一。"
                            type="success"
                            showIcon
                        />
                    </Col>
                </Row>
            </Card>
        </div>
    );
}

type PlanFormValues = {
    id?: string;
    code: string;
    name: string;
    planYear: string;
    orgKey: string;
    companyLevelTwo: string;
    companyLevelThree: string;
    unitName: string;
    category: string;
    domain: string;
    policyDirection: string;
    policyName: string;
    brief: string;
    goal: string;
    buildMode: string;
    buildType: string;
    inPlan: string;
    planningFileName: string;
    aiEnabled: string;
    bigDataEnabled: string;
    smartManufacturingEnabled: string;
    includedInOtherInvestment: string;
    otherInvestmentName: string;
    startDate: string;
    endDate: string;
    accountingSubject: string;
    selfFunding: number;
    externalFunding: number;
    otherFunding: number;
    softwareFunding: number;
    hardwareFunding: number;
    otherTechFunding: number;
};

function createBlankPlan(sequence: number): PlanFormValues {
    return {
        id: undefined,
        code: getNextPlanCode(sequence),
        name: '',
        planYear: String(currentPlanYear),
        orgKey: '01',
        companyLevelTwo: companyOptions[0]?.label || '',
        companyLevelThree: '天山材料股份有限公司',
        unitName: '信息化管理部',
        category: projectCategoryOptions[0]?.label || '',
        domain: businessDomainOptions[17]?.label || '',
        policyDirection: policyDirectionOptions[0]?.value || '',
        policyName: '集团数字化转型指导意见',
        brief: '',
        goal: '',
        buildMode: buildModeOptions[1]?.value || '',
        buildType: buildTypeOptions[0]?.value || '',
        inPlan: yesNoOptions[0]?.value || '',
        planningFileName: '天山材料十四五数字化规划',
        aiEnabled: '01',
        bigDataEnabled: '02',
        smartManufacturingEnabled: '02',
        includedInOtherInvestment: '01',
        otherInvestmentName: '',
        startDate: `${currentPlanYear}-01-08`,
        endDate: `${currentPlanYear}-12-20`,
        accountingSubject: accountingOptions[0]?.value || '',
        selfFunding: 0,
        externalFunding: 0,
        otherFunding: 0,
        softwareFunding: 0,
        hardwareFunding: 0,
        otherTechFunding: 0,
    };
}

function toFormValues(record: PlatformPlanRecord): PlanFormValues {
    return {
        id: record.id,
        code: record.code,
        name: record.name,
        planYear: record.planYear,
        orgKey: record.orgKey,
        companyLevelTwo: record.companyLevelTwo,
        companyLevelThree: record.companyLevelThree,
        unitName: record.unitName,
        category: record.category,
        domain: record.domain,
        policyDirection: record.policyDirection,
        policyName: record.policyName,
        brief: record.brief,
        goal: record.goal,
        buildMode: record.buildMode,
        buildType: record.buildType,
        inPlan: record.inPlan,
        planningFileName: record.planningFileName,
        aiEnabled: record.aiEnabled,
        bigDataEnabled: record.bigDataEnabled,
        smartManufacturingEnabled: record.smartManufacturingEnabled,
        includedInOtherInvestment: record.includedInOtherInvestment,
        otherInvestmentName: record.otherInvestmentName,
        startDate: record.startDate,
        endDate: record.endDate,
        accountingSubject: record.accountingSubject,
        selfFunding: record.selfFunding,
        externalFunding: record.externalFunding,
        otherFunding: record.otherFunding,
        softwareFunding: record.softwareFunding,
        hardwareFunding: record.hardwareFunding,
        otherTechFunding: record.otherTechFunding,
    };
}

function formValuesToRecord(values: PlanFormValues, existing?: PlatformPlanRecord, nextSequence = 1): PlatformPlanRecord {
    const companyLabel = companyOptions.find((item) => item.value === values.orgKey)?.label || values.companyLevelTwo;
    const now = nowString();
    return {
        id: existing?.id || `plan-new-${Date.now()}`,
        code: existing?.code || values.code || getNextPlanCode(nextSequence),
        name: values.name.trim(),
        planYear: values.planYear,
        orgKey: values.orgKey,
        companyLevelTwo: companyLabel,
        companyLevelThree: values.companyLevelThree.trim(),
        unitName: values.unitName.trim(),
        category: values.category,
        domain: values.domain,
        policyDirection: values.policyDirection,
        policyName: values.policyName.trim(),
        brief: values.brief.trim(),
        goal: values.goal.trim(),
        buildMode: values.buildMode,
        buildType: values.buildType,
        inPlan: values.inPlan,
        planningFileName: values.planningFileName.trim(),
        aiEnabled: values.aiEnabled,
        bigDataEnabled: values.bigDataEnabled,
        smartManufacturingEnabled: values.smartManufacturingEnabled,
        includedInOtherInvestment: values.includedInOtherInvestment,
        otherInvestmentName: values.otherInvestmentName.trim(),
        startDate: values.startDate,
        endDate: values.endDate,
        accountingSubject: values.accountingSubject,
        selfFunding: Number(values.selfFunding || 0),
        externalFunding: Number(values.externalFunding || 0),
        otherFunding: Number(values.otherFunding || 0),
        softwareFunding: Number(values.softwareFunding || 0),
        hardwareFunding: Number(values.hardwareFunding || 0),
        otherTechFunding: Number(values.otherTechFunding || 0),
        status: existing?.status === 'approved' || existing?.status === 'pending-review' ? existing.status : (existing?.status || 'draft'),
        creator: existing?.creator || '计划管理员',
        submitTime: existing?.submitTime,
        reviewTime: existing?.reviewTime,
        reviewRemark: existing?.reviewRemark,
        reviewer: existing?.reviewer,
        updatedAt: now,
    };
}

function BasicFormSection({ form, readonly = false }: { form: any; readonly?: boolean }) {
    const policyDirection = Form.useWatch('policyDirection', form);
    const inPlan = Form.useWatch('inPlan', form);
    const includedInOtherInvestment = Form.useWatch('includedInOtherInvestment', form);

    const policyDisabled = policyDirection === '04';
    const inPlanDisabled = inPlan === '02';
    const otherInvDisabled = includedInOtherInvestment === '02';

    return (
        <Card size="small" title="基础信息">
            <Row gutter={16}>
                <Col xs={24} md={8}>
                    <Form.Item name="code" label="计划编码">
                        <Input disabled />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="planYear"
                        label="计划年度"
                        rules={[{ required: true, message: '请选择计划年度。' }]}
                    >
                        <Select options={planYearOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="name"
                        label="计划名称"
                        rules={[{ required: true, message: '请输入计划名称。' }]}
                    >
                        <Input maxLength={50} showCount placeholder="全局唯一" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="orgKey"
                        label="集团/股份二级企业简称"
                        rules={[{ required: true, message: '请选择集团/股份二级企业简称。' }]}
                    >
                        <Select options={companyOptions} disabled />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="companyLevelThree"
                        label="集团/股份三级企业简称"
                        rules={[{ required: true, message: '请输入集团/股份三级企业简称。' }]}
                    >
                        <Input maxLength={50} showCount disabled />
                    </Form.Item>
                </Col>
                <Col xs={24} md={24}>
                    <Form.Item
                        name="unitName"
                        label="单位名称"
                        rules={[{ required: true, message: '请输入单位名称。' }]}
                    >
                        <Input maxLength={50} showCount disabled />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item name="category" label="项目类别" rules={[{ required: true }]}>
                        <Select options={projectCategoryOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item name="domain" label="业务域分类" rules={[{ required: true }]}>
                        <Select options={businessDomainOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="policyDirection"
                        label="政策指导方向"
                        rules={[{ required: true }]}
                    >
                        <Select
                            options={policyDirectionOptions}
                            onChange={() => {
                                form.setFieldValue('policyName', '');
                            }}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="policyName"
                        label="政策名称"
                        rules={policyDisabled ? [] : [{ required: true, message: '请输入政策名称。' }]}
                    >
                        <Input maxLength={100} showCount={!readonly} disabled={readonly || policyDisabled || undefined} placeholder={policyDisabled ? '无指导政策时无需填写' : undefined} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item name="buildMode" label="建设模式" rules={[{ required: true }]}>
                        <Select options={buildModeOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item name="buildType" label="建设类型" rules={[{ required: true }]}>
                        <Select options={buildTypeOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="inPlan"
                        label="是否规划内项目"
                        rules={[{ required: true }]}
                    >
                        <Select
                            options={yesNoOptions}
                            onChange={() => {
                                form.setFieldValue('planningFileName', '');
                            }}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="planningFileName"
                        label="规划文件名称"
                        rules={inPlanDisabled ? [] : [{ required: true, message: '请输入规划文件名称。' }]}
                    >
                        <Input maxLength={100} showCount={!readonly} disabled={readonly || inPlanDisabled || undefined} placeholder={inPlanDisabled ? '非规划内项目时无需填写' : undefined} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="aiEnabled" label="项目是否涉及人工智能" rules={[{ required: true }]}>
                        <Select options={yesNoOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="bigDataEnabled" label="项目是否涉及大数据分析" rules={[{ required: true }]}>
                        <Select options={yesNoOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="smartManufacturingEnabled" label="项目是否涉及智能制造" rules={[{ required: true }]}>
                        <Select options={yesNoOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="includedInOtherInvestment"
                        label="是否包含在其他非数字化投资项目中"
                        rules={[{ required: true }]}
                    >
                        <Select
                            options={yesNoOptions}
                            onChange={() => {
                                form.setFieldValue('otherInvestmentName', '');
                            }}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="otherInvestmentName"
                        label="其它投资项目名称"
                        rules={otherInvDisabled ? [] : [{ required: true, message: '请输入其它投资项目名称。' }]}
                    >
                        <Input maxLength={100} showCount disabled={otherInvDisabled} placeholder={otherInvDisabled ? '不涉及其他项目时无需填写' : undefined} />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    );
}

function TimelineFundingSection({ form }: { form: any }) {
    return (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Card size="small" title="项目时间规划">
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="startDate"
                            label="启动时间"
                            rules={[{ required: true, message: '请选择启动时间。' }]}
                        >
                            <Input type="date" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="endDate"
                            label="预计完成时间"
                            rules={[{ required: true, message: '请选择预计完成时间。' }]}
                        >
                            <Input type="date" />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item name="accountingSubject" label="会计核算科目" rules={[{ required: true }]}>
                    <Select options={accountingOptions} />
                </Form.Item>
            </Card>

            <Card size="small" title="2026年计划投资额">
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="selfFunding"
                            label="自有资金"
                            rules={[{ required: true, message: '请输入自有资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="externalFunding"
                            label="外部资金"
                            rules={[{ required: true, message: '请输入外部资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="otherFunding"
                            label="其他"
                            rules={[{ required: true, message: '请输入其他资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
                <Divider style={{ margin: '8px 0 16px' }} />
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="softwareFunding"
                            label="软件"
                            rules={[{ required: true, message: '请输入软件资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="hardwareFunding"
                            label="硬件"
                            rules={[{ required: true, message: '请输入硬件资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="otherTechFunding"
                            label="其他"
                            rules={[{ required: true, message: '请输入其他技术资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>
        </Space>
    );
}

function PlanDrawer({
    open,
    onClose,
    onSubmit,
    existing,
    sequence,
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: PlanFormValues) => void;
    existing: PlatformPlanRecord | null;
    sequence: number;
}) {
    const [form] = Form.useForm<PlanFormValues>();

    useEffect(() => {
        if (open) {
            form.setFieldsValue(existing ? toFormValues(existing) : createBlankPlan(sequence));
        }
    }, [existing, form, open, sequence]);

    return (
        <Drawer
            title={existing ? '编辑投资计划' : '新增投资计划'}
            open={open}
            width={1120}
            onClose={onClose}
            destroyOnClose
            extra={
                <Space>
                    <Button onClick={onClose}>取消</Button>
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={() => form.submit()}
                    >
                        保存
                    </Button>
                </Space>
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onSubmit}
                initialValues={existing ? toFormValues(existing) : createBlankPlan(1)}
            >
                <BasicFormSection form={form} />
                <Divider />
                <TimelineFundingSection form={form} />
            </Form>
        </Drawer>
    );
}

function PlanFillPage() {
    const { records, saveDraft, deleteDraft, submitDrafts } = usePlatformStore();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<PlatformPlanRecord | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [filters, setFilters] = useState<{ keyword?: string; year?: string; category?: string }>({});
    const draftRecords = records.filter((record) => record.status === 'draft' || record.status === 'returned');
    const filteredDraftRecords = useMemo(() => {
        const keyword = String(filters.keyword || '').trim().toLowerCase();
        const year = String(filters.year || '').trim();
        const category = String(filters.category || '').trim();

        return draftRecords.filter((record) => {
            if (keyword) {
                const combined = [record.name, record.code, record.unitName, record.companyLevelTwo]
                    .join(' ')
                    .toLowerCase();
                if (!combined.includes(keyword)) {
                    return false;
                }
            }
            if (year && !record.code.includes(year)) {
                return false;
            }
            if (category && record.category !== category) {
                return false;
            }
            return true;
        });
    }, [draftRecords, filters]);

    const nextSequence = useMemo(() => {
        const sequences = records
            .map((item) => Number(String(item.code).split('-').pop() || 0))
            .filter((value) => Number.isFinite(value));
        return (Math.max(...sequences, 0) || 0) + 1;
    }, [records]);

    const openCreateDrawer = () => {
        setEditingRecord(null);
        setDrawerOpen(true);
    };

    const openEditDrawer = (record: PlatformPlanRecord) => {
        setEditingRecord(record);
        setDrawerOpen(true);
    };

    const handleSave = (values: PlanFormValues) => {
        const record = formValuesToRecord(values, editingRecord || undefined, nextSequence);
        saveDraft(record);
        message.success(editingRecord ? '计划已保存更新。' : '计划已新增保存。');
        setDrawerOpen(false);
        setEditingRecord(null);
    };

    const handleDelete = (record: PlatformPlanRecord) => {
        Modal.confirm({
            title: '确认删除该投资计划？',
            icon: <ExclamationCircleOutlined />,
            content: '删除后将从填报列表中移除。',
            okText: '删除',
            okButtonProps: { danger: true },
            onOk: () => deleteDraft(record.id),
        });
    };

    const handleDownloadTemplate = () => {
        const templateRows = buildCsv([
            {
                ...initialPlanRecords[0],
                id: 'template',
                code: '自动生成',
                name: '计划名称',
                companyLevelThree: '集团/股份三级企业简称',
                unitName: '单位名称',
                status: 'draft',
            },
        ]);
        downloadTextFile('投资计划导入模板.csv', templateRows);
        message.success('已下载导入模板（CSV 演示版）。');
    };

    const handleImportDemo = () => {
        const record = formValuesToRecord({
            ...createBlankPlan(nextSequence + 1),
            name: '模板导入示例计划',
            companyLevelThree: '模板导入演示公司',
            unitName: '信息化中心',
            brief: '模板导入演示数据。',
            goal: '用于演示导入后进入填报列表。',
            planningFileName: '演示模板',
            otherInvestmentName: '无',
            selfFunding: 80,
            externalFunding: 20,
            otherFunding: 0,
            softwareFunding: 60,
            hardwareFunding: 20,
            otherTechFunding: 20,
        }, undefined, nextSequence + 1);
        saveDraft(record);
        message.success('模板导入成功，已生成一条填报记录。');
        setImportOpen(false);
    };

    const columns = buildPlanColumns({
        onEdit: openEditDrawer,
        onDelete: handleDelete,
    });

    return (
        <div className="dmp-page-stack">
            <Card className="dmp-query-card" bordered={false}>
                <Form
                    layout="inline"
                    className="dmp-query-form"
                    initialValues={{}}
                    onValuesChange={(_, allValues) => setFilters(allValues)}
                >
                    <Form.Item name="keyword" label="计划名称/编码">
                        <Input allowClear placeholder="请输入计划名称或编码" style={{ width: 260 }} />
                    </Form.Item>
                    <Form.Item name="year" label="年度">
                        <Select
                            allowClear
                            placeholder="请选择年度"
                            style={{ width: 140 }}
                            options={Array.from({ length: 10 }, (_, i) => {
                                const year = currentPlanYear + 1 - i;
                                return { value: String(year), label: String(year) };
                            })}
                        />
                    </Form.Item>
                    <Form.Item name="category" label="项目类别">
                        <Select
                            allowClear
                            placeholder="请选择项目类别"
                            style={{ width: 360 }}
                            options={projectCategoryOptions}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                            <Button onClick={() => setFilters({})}>重置</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            <Card
                title={`投资计划填报列表（${filteredDraftRecords.length} 条）`}
                extra={(
                    <Space wrap>
                        <Button icon={<CloudDownloadOutlined />} onClick={handleDownloadTemplate}>模板下载</Button>
                        <Button icon={<CloudUploadOutlined />} onClick={() => setImportOpen(true)}>导入</Button>
                        <Button icon={<ReloadOutlined />} onClick={() => message.success('填报列表已刷新。')}>刷新</Button>
                        <Button type="primary" icon={<ArrowUpOutlined />} onClick={submitDrafts} disabled={draftRecords.length === 0}>
                            批量提交
                        </Button>
                        <Button type="primary" icon={<ScheduleOutlined />} onClick={openCreateDrawer}>新增</Button>
                    </Space>
                )}
            >
                <Table
                    rowKey="id"
                    dataSource={filteredDraftRecords}
                    columns={columns}
                    pagination={false}
                />
            </Card>

            <PlanDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSubmit={handleSave}
                existing={editingRecord}
                sequence={nextSequence}
            />

            <Modal
                title="模板导入演示"
                open={importOpen}
                onCancel={() => setImportOpen(false)}
                onOk={handleImportDemo}
                okText="生成示例数据"
            >
                <Alert
                    type="warning"
                    showIcon
                    message="当前原型采用模拟导入方式，点击确认后会生成一条新的草稿记录。"
                    style={{ marginBottom: 16 }}
                />
                <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="模板格式">Excel/CSV 模板字段需与计划表单一致</Descriptions.Item>
                    <Descriptions.Item label="字段限制">计划名称 50 字符，政策名称 100 字符，描述 500 字符</Descriptions.Item>
                    <Descriptions.Item label="导入校验">缺少必填字段会被判定为失败</Descriptions.Item>
                </Descriptions>
            </Modal>
        </div>
    );
}

function ReviewDrawer({
    record,
    open,
    onClose,
    onApprove,
    onReturn,
    readonly = false,
}: {
    record: PlatformPlanRecord | null;
    open: boolean;
    onClose: () => void;
    onApprove?: (remark?: string) => void;
    onReturn?: (remark: string) => void;
    readonly?: boolean;
}) {
    const [readonlyForm] = Form.useForm<PlanFormValues>();

    useEffect(() => {
        if (open && record) {
            readonlyForm.resetFields();
            readonlyForm.setFieldsValue(toFormValues(record));
        }
    }, [readonlyForm, open, record]);

    return (
        <Drawer
            title={readonly ? '投资计划详情' : '投资计划审核'}
            width={1120}
            open={open}
            onClose={onClose}
            destroyOnClose
            extra={readonly ? (
                <Button onClick={onClose}>关闭</Button>
            ) : (
                <Space>
                    <Button onClick={onClose}>关闭</Button>
                    <Button
                        style={{ backgroundColor: '#1677ff', borderColor: '#1677ff', color: '#fff' }}
                        onClick={() => onApprove?.()}
                    >
                        通过
                    </Button>
                    <Button
                        danger
                        onClick={() => onReturn?.('请补充材料后重新提交。')}
                    >
                        退回
                    </Button>
                </Space>
            )}
        >
            {record ? (
                <Form form={readonlyForm} layout="vertical" disabled>
                    <BasicFormSection form={readonlyForm} readonly={readonly} />
                    <Divider />
                    <TimelineFundingSection form={readonlyForm} />
                </Form>
            ) : null}
        </Drawer>
    );
}

function PlanReviewPage() {
    const { records, approvePlan, returnPlan } = usePlatformStore();
    const pendingRecords = records.filter((record) => record.status === 'pending-review');
    const [selectedOrgKey, setSelectedOrgKey] = useState('15');
    const [currentRecord, setCurrentRecord] = useState<PlatformPlanRecord | null>(pendingRecords[0] || null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [filters, setFilters] = useState<{ keyword?: string; year?: string }>({});
    const [includeChildren, setIncludeChildren] = useState(true);
    const [treeSearch, setTreeSearch] = useState('');
    const [treeExpandedKeys, setTreeExpandedKeys] = useState<string[]>(['group']);

    useEffect(() => {
        if (!currentRecord || !pendingRecords.some((item) => item.id === currentRecord.id)) {
            setCurrentRecord(pendingRecords[0] || null);
        }
    }, [currentRecord, pendingRecords]);

    const filteredRecords = useMemo(() => {
        const keyword = String(filters.keyword || '').trim().toLowerCase();
        const year = String(filters.year || '').trim();

        let records = pendingRecords;
        if (selectedOrgKey !== 'group') {
            if (includeChildren) {
                records = records.filter((record) => record.orgKey === selectedOrgKey || record.orgKey.startsWith(selectedOrgKey + '-'));
            } else {
                records = records.filter((record) => record.orgKey === selectedOrgKey);
            }
        }
        if (keyword) {
            records = records.filter((record) => {
                const combined = [record.name, record.code, record.unitName, record.companyLevelTwo]
                    .join(' ')
                    .toLowerCase();
                return combined.includes(keyword);
            });
        }
        if (year) {
            records = records.filter((record) => record.code.includes(year));
        }
        return records;
    }, [pendingRecords, selectedOrgKey, includeChildren, filters]);

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

    const openDrawer = (record: PlatformPlanRecord) => {
        setCurrentRecord(record);
        setDrawerOpen(true);
    };

    const handleBatchApprove = () => {
        filteredRecords.forEach((record) => approvePlan(record.id, '计划符合要求，予以通过。'));
    };

    const handleBatchReturn = () => {
        filteredRecords.forEach((record) => returnPlan(record.id, '请补充材料后重新提交。'));
    };

    const columns: ColumnsType<PlatformPlanRecord> = [
        { title: '计划编码', dataIndex: 'code', width: 150 },
        { title: '计划名称', dataIndex: 'name', width: 240, ellipsis: true },
        {
            title: '单位名称',
            width: 120,
            ellipsis: true,
            render: () => orgTreeData[0]?.children?.find((n) => n.key === selectedOrgKey)?.title || '',
        },
        {
            title: '投资总额(万元)',
            width: 130,
            render: (_, record) => `¥ ${formatMoney(getPlanTotal(record))}`,
        },
        { title: '项目类别', dataIndex: 'category', width: 160, ellipsis: true },
        {
            title: '提交时间',
            dataIndex: 'submitTime',
            width: 150,
        },
        {
            title: '状态',
            width: 100,
            render: () => <Tag color="processing">待审核</Tag>,
        },
        {
            title: '操作',
            width: 100,
            fixed: 'right',
            render: (_, record) => (
                <Button type="link" size="small" onClick={() => openDrawer(record)}>详情</Button>
            ),
        },
    ];

    return (
        <div className="dmp-page-stack">
            <Row gutter={16}>
                <Col xs={24} lg={6}>
                    <Card className="dmp-card-fill">
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
                <Col xs={24} lg={18}>
                    <Card className="dmp-query-card" bordered={false}>
                        <Form
                            layout="inline"
                            className="dmp-query-form"
                            initialValues={{}}
                            onValuesChange={(_, allValues) => setFilters(allValues)}
                        >
                            <Form.Item name="keyword" label="计划名称/编码">
                                <Input allowClear placeholder="请输入计划名称或编码" style={{ width: 260 }} />
                            </Form.Item>
                            <Form.Item name="year" label="年度">
                                <Select
                                    allowClear
                                    placeholder="请选择年度"
                                    style={{ width: 140 }}
                                    options={Array.from({ length: 10 }, (_, i) => {
                                        const year = currentPlanYear + 1 - i;
                                        return { value: String(year), label: String(year) };
                                    })}
                                />
                            </Form.Item>
                            <Form.Item>
                                <Space>
                                    <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                                    <Button onClick={() => setFilters({})}>重置</Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Card>

                    <Card
                        title={`待审核计划（${filteredRecords.length} 条）`}
                        style={{ marginTop: 12 }}
                        extra={filteredRecords.length > 0 ? (
                            <Space>
                                <Button
                                    style={{ backgroundColor: '#1677ff', borderColor: '#1677ff', color: '#fff' }}
                                    onClick={handleBatchApprove}
                                >
                                    通过
                                </Button>
                                <Button
                                    danger
                                    onClick={handleBatchReturn}
                                >
                                    退回
                                </Button>
                            </Space>
                        ) : null}
                    >
                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={filteredRecords}
                            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
                            scroll={{ x: 1200 }}
                        />
                    </Card>
                </Col>
            </Row>

            <ReviewDrawer
                record={currentRecord}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onApprove={(remark) => {
                    if (currentRecord) {
                        approvePlan(currentRecord.id, remark);
                    }
                    setDrawerOpen(false);
                }}
                onReturn={(remark) => {
                    if (currentRecord) {
                        returnPlan(currentRecord.id, remark);
                    }
                    setDrawerOpen(false);
                }}
            />
        </div>
    );
}

function PlanViewPage() {
    const { records } = usePlatformStore();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<PlatformPlanRecord | null>(null);
    const [selectedOrgKey, setSelectedOrgKey] = useState('15');
    const [form] = Form.useForm<{ planQuery?: string; year?: string }>();
    const [filters, setFilters] = useState<{ planQuery?: string; year?: string }>({ year: String(currentPlanYear) });
    const [includeChildren, setIncludeChildren] = useState(true);
    const [treeSearch, setTreeSearch] = useState('');
    const [treeExpandedKeys, setTreeExpandedKeys] = useState<string[]>(['group']);

    const planQuery = String(filters.planQuery || '').trim().toLowerCase();
    const year = filters.year || '';

    const filteredRecords = useMemo(() => records.filter((record) => {
        if (record.status !== 'approved') {
            return false;
        }
        if (selectedOrgKey !== 'group') {
            if (includeChildren) {
                if (record.orgKey !== selectedOrgKey && !record.orgKey.startsWith(selectedOrgKey + '-')) {
                    return false;
                }
            } else {
                if (record.orgKey !== selectedOrgKey) {
                    return false;
                }
            }
        }
        if (planQuery) {
            const combined = [record.code, record.name].join(' ').toLowerCase();
            if (!combined.includes(planQuery)) {
                return false;
            }
        }
        if (year) {
            const recordYear = record.startDate ? record.startDate.slice(0, 4) : '';
            if (recordYear !== year) {
                return false;
            }
        }
        return true;
    }), [planQuery, records, year, selectedOrgKey, includeChildren]);

    const handleSearch = () => {
        setFilters(form.getFieldsValue());
    };

    const handleReset = () => {
        form.resetFields();
        form.setFieldsValue({ year: String(currentPlanYear) });
        setFilters({ year: String(currentPlanYear) });
    };

    const openDetail = (record: PlatformPlanRecord) => {
        setCurrentRecord(record);
        setDrawerOpen(true);
    };

    const exportRows = () => {
        downloadTextFile(
            `投资计划查看导出-${Date.now()}.csv`,
            buildCsv(filteredRecords),
        );
        message.success('已导出当前查询结果（CSV 演示版）。');
    };

    const selectedOrgName = useMemo(() => {
        const findTitle = (nodes: TreeDataNode[], key: string): string | null => {
            for (const node of nodes) {
                if (node.key === key) return String(node.title);
                if (node.children) {
                    const found = findTitle(node.children as TreeDataNode[], key);
                    if (found) return found;
                }
            }
            return null;
        };
        return findTitle(orgTreeData as TreeDataNode[], selectedOrgKey) || '全部';
    }, [selectedOrgKey]);

    const columns: ColumnsType<PlatformPlanRecord> = [
        { title: '计划编码', dataIndex: 'code', width: 130 },
        { title: '计划名称', dataIndex: 'name', width: 200, ellipsis: true },
        { title: '单位名称', width: 140, render: () => selectedOrgName },
        { title: '项目类别', dataIndex: 'category', width: 160, ellipsis: true },
        {
            title: '投资总额(万元)',
            width: 130,
            render: (_, record) => `¥ ${formatMoney(getPlanTotal(record))}`,
        },
        {
            title: '操作',
            width: 100,
            fixed: 'right',
            render: (_, record) => <Button type="link" size="small" onClick={() => openDetail(record)}>详情</Button>,
        },
    ];

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

    return (
        <div className="dmp-page-stack">
            <PageHero pageId="plan-view" />

            <Row gutter={16}>
                <Col xs={24} lg={6}>
                    <Card className="dmp-card-fill">
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
                <Col xs={24} lg={18}>
                    <Card
                        title={`投资计划列表（${filteredRecords.length} 条）`}
                        extra={<Button icon={<CloudDownloadOutlined />} onClick={exportRows}>导出</Button>}
                    >
                        <Form
                            form={form}
                            layout="inline"
                            style={{ marginBottom: 16 }}
                            initialValues={{ year: String(currentPlanYear) }}
                        >
                            <Form.Item name="planQuery" label="计划名称/编码">
                                <Input allowClear placeholder="请输入计划名称或编码" style={{ width: 220 }} />
                            </Form.Item>
                            <Form.Item name="year" label="年度">
                                <Select
                                    allowClear
                                    placeholder="请选择年度"
                                    style={{ width: 160 }}
                                    options={Array.from({ length: 10 }, (_, i) => {
                                        const y = currentPlanYear + 1 - i;
                                        return { value: String(y), label: String(y) };
                                    })}
                                />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" onClick={handleSearch}>查询</Button>
                            </Form.Item>
                            <Form.Item>
                                <Button onClick={handleReset}>重置</Button>
                            </Form.Item>
                        </Form>
                        <Table
                            rowKey="id"
                            dataSource={filteredRecords}
                            columns={columns}
                            pagination={{
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total) => `共 ${total} 条`,
                                defaultPageSize: 10,
                                pageSizeOptions: ['10', '20', '50'],
                            }}
                            scroll={{ x: 1000 }}
                        />
                    </Card>
                </Col>
            </Row>

            <ReviewDrawer
                record={currentRecord}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                readonly
            />
        </div>
    );
}


function PlaceholderPage({ pageId }: { pageId: MenuPageId }) {
    const meta = pageMeta[pageId];
    const group = menuGroups.find((item) => item.title === meta.group);
    const children = group?.children || [];

    return (
        <div className="dmp-page-stack">
            <PageHero
                pageId={pageId}
                extra={<Tag icon={<InfoCircleOutlined />} color="blue">占位页面</Tag>}
            />

            <Row gutter={16}>
                <Col xs={24} lg={16}>
                    <Card title="页面说明" className="dmp-card-fill">
                        <Alert
                            type="info"
                            showIcon
                            message="当前页面先提供平台级骨架和占位内容，后续可按同样的 Ant Design 结构继续补齐业务细节。"
                        />
                        <Divider />
                        <Paragraph>
                            {meta.summary}
                        </Paragraph>
                        <Paragraph>
                            这类页面建议直接复用同一套组织树、列表筛选、抽屉详情和导出交互，确保整个平台的操作方式统一。
                        </Paragraph>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="同组菜单">
                        <Space direction="vertical" style={{ width: '100%' }} size={12}>
                            {children.map((child) => (
                                <Card key={child.id} size="small">
                                    <Text strong>{child.title}</Text>
                                    <div><Text type="secondary">{child.summary}</Text></div>
                                </Card>
                            ))}
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

function HomePage() {
    return (
        <div className="dmp-home">
            <div className="dmp-home-bg">
                <div className="dmp-home-cloud cloud-1" />
                <div className="dmp-home-cloud cloud-2" />
                <div className="dmp-home-cloud cloud-3" />
                <div className="dmp-home-cloud cloud-4" />
                <div className="dmp-home-cloud cloud-5" />
                <div className="dmp-home-cloud cloud-6" />
            </div>
            <div className="dmp-home-content">
                <h1 className="dmp-home-title">智云瞰</h1>
                <p className="dmp-home-subtitle">中国建材集团数字化管理平台</p>
            </div>
        </div>
    );
}

function AppContent() {
    const { page, setPage } = useHashPage(route);
    const meta = pageMeta[page as MenuPageId];
    const [collapsed, setCollapsed] = useState(false);
    const [isBroken, setIsBroken] = useState(false);
    const [openKeys, setOpenKeys] = useState<string[]>(['plan']);
    const [openTabs, setOpenTabs] = useState<Array<{ id: MenuPageId; title: string }>>([
        { id: 'home', title: '首页' },
    ]);
    const skipMenuSyncRef = useRef(false);
    const tabsScrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const updateScrollState = useCallback(() => {
        const el = tabsScrollRef.current;
        if (!el) return;
        const hasOverflow = el.scrollWidth > el.clientWidth;
        setCanScrollLeft(el.scrollLeft > 1);
        setCanScrollRight(hasOverflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useLayoutEffect(() => {
        updateScrollState();
    });

    useEffect(() => {
        const el = tabsScrollRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            updateScrollState();
        });
        ro.observe(el);
        const onScroll = () => updateScrollState();
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            ro.disconnect();
            el.removeEventListener('scroll', onScroll);
        };
    }, [updateScrollState]);

    // 自动滚动到最后加入的标签（最右侧）
    const prevTabsLengthRef = useRef(openTabs.length);
    useEffect(() => {
        const el = tabsScrollRef.current;
        if (!el) return;
        if (openTabs.length > prevTabsLengthRef.current) {
            // 有新增标签，滚动到最右侧
            el.scrollTo({ left: el.scrollWidth - el.clientWidth, behavior: 'smooth' });
        }
        prevTabsLengthRef.current = openTabs.length;
    }, [openTabs.length]);

    const handleScrollLeft = () => {
        const el = tabsScrollRef.current;
        if (!el) return;
        el.scrollBy({ left: -200, behavior: 'smooth' });
    };

    const handleScrollRight = () => {
        const el = tabsScrollRef.current;
        if (!el) return;
        el.scrollBy({ left: 200, behavior: 'smooth' });
    };

    useEffect(() => {
        if (skipMenuSyncRef.current) {
            skipMenuSyncRef.current = false;
            return;
        }
        const groupKey = pageGroupOpenKeyMap[page as MenuPageId];
        setOpenKeys(groupKey ? [groupKey] : []);
    }, [page]);

    useEffect(() => {
        setOpenTabs((current) => {
            if (current.some((tab) => tab.id === page)) {
                return current;
            }
            return [...current, { id: page as MenuPageId, title: meta.title }];
        });
    }, [page, meta.title]);

    const selectedKeys = [page];

    const menuItems: MenuProps['items'] = [
        ...menuGroups.map((group) => ({
            key: group.key,
            icon: menuIconMap[group.icon] || <AppstoreOutlined />,
            label: group.title,
            children: group.children.map((child) => ({
                key: child.id,
                label: child.title,
            })),
        })),
    ];

    const handleTabClick = (tabId: string) => {
        if (tabId === page) {
            return;
        }
        skipMenuSyncRef.current = true;
        setPage(tabId);
    };

    const handleTabClose = (tabId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenTabs((current) => {
            const index = current.findIndex((tab) => tab.id === tabId);
            const next = current.filter((tab) => tab.id !== tabId);
            if (page === tabId) {
                if (next.length > 0) {
                    const newPage = next[Math.max(0, index - 1)]?.id || next[0].id;
                    setPage(newPage);
                } else {
                    setPage('home');
                }
            }
            return next;
        });
    };

    const renderPage = () => {
        switch (page as MenuPageId) {
            case 'home':
                return <HomePage />;
            case 'plan-fill':
                return <PlanFillPage />;
            case 'plan-review':
                return <PlanReviewPage />;
            case 'plan-view':
                return <PlanViewPage />;
            case 'filing-management':
                return <FilingManagementPage />;
            case 'expert-database':
                return <ExpertDatabasePage />;
            default:
                return <PlaceholderPage pageId={page as MenuPageId} />;
        }
    };

    return (
        <Layout className="dmp-shell">
            <Sider
                className="dmp-sider"
                width={280}
                collapsedWidth={isBroken ? 0 : 84}
                breakpoint="lg"
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                onBreakpoint={setIsBroken}
                trigger={null}
            >
                <div className={collapsed ? 'dmp-brand is-collapsed' : 'dmp-brand'}>
                    <div className="dmp-brand-mark">DM</div>
                    {!collapsed ? (
                        <div>
                            <Title level={4}>数字化管理平台</Title>
                            <Text type="secondary">Plan • Budget • Project • Resource</Text>
                        </div>
                    ) : null}
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={selectedKeys}
                    openKeys={openKeys}
                    onOpenChange={(keys) => setOpenKeys(keys as string[])}
                    items={menuItems}
                    onClick={(info) => setPage(String(info.key))}
                    className="dmp-menu"
                />
            </Sider>

            <Layout className="dmp-main">
                <Header className="dmp-header">
                    <div className="dmp-header-row">
                        <div className="dmp-header-left">
                            <Button
                                className="dmp-collapse-btn"
                                type="text"
                                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                onClick={() => setCollapsed((value) => !value)}
                            />
                            <div className="dmp-top-tabs-wrapper">
                                {canScrollLeft ? (
                                    <button
                                        className="dmp-top-tabs-arrow"
                                        onClick={handleScrollLeft}
                                        aria-label="向左滑动"
                                    >
                                        <LeftOutlined />
                                    </button>
                                ) : null}
                                <div
                                    className="dmp-top-tabs"
                                    role="tablist"
                                    aria-label="页面导航"
                                    ref={tabsScrollRef}
                                >
                                    {openTabs.map((tab) => {
                                        const isActive = tab.id === page;
                                        const isHome = tab.id === 'home';
                                        return (
                                            <div
                                                key={tab.id}
                                                className={isActive ? 'dmp-top-tab is-active' : 'dmp-top-tab'}
                                                onClick={() => handleTabClick(tab.id)}
                                                role="tab"
                                                aria-selected={isActive}
                                            >
                                                <span className="dmp-top-tab-text">{tab.title}</span>
                                                {!isHome ? (
                                                    <span
                                                        className="dmp-top-tab-close"
                                                        onClick={(e) => handleTabClose(tab.id, e)}
                                                        role="button"
                                                        aria-label="关闭"
                                                    >
                                                        <CloseOutlined />
                                                    </span>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                                {canScrollRight ? (
                                    <button
                                        className="dmp-top-tabs-arrow"
                                        onClick={handleScrollRight}
                                        aria-label="向右滑动"
                                    >
                                        <RightOutlined />
                                    </button>
                                ) : null}
                            </div>
                        </div>
                        <div className="dmp-header-right">
                            <span className="dmp-greeting">你好，管理员</span>
                            <Badge count={0} size="small">
                                <Button
                                    type="text"
                                    className="dmp-icon-btn"
                                    icon={<BellOutlined />}
                                    onClick={() => message.info('暂无新的系统消息。')}
                                />
                            </Badge>
                            <Button
                                type="text"
                                className="dmp-icon-btn"
                                icon={<EllipsisOutlined />}
                                onClick={() => message.info('更多操作入口可在这里扩展。')}
                            />
                        </div>
                    </div>
                </Header>

                <Content className="dmp-content">
                    <ExpertStoreProvider>
                        <PlatformStoreProvider>
                            <App>
                                {renderPage()}
                            </App>
                        </PlatformStoreProvider>
                    </ExpertStoreProvider>
                </Content>
            </Layout>
        </Layout>
    );
}

export default function DigitalManagementPlatformApp() {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#e60012',
                    borderRadius: 8,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
                },
                components: {
                    Layout: {
                        bodyBg: '#f5f7fb',
                        headerBg: '#ffffff',
                        siderBg: '#ffffff',
                    },
                    Menu: {
                        itemHeight: 42,
                    },
                },
            }}
        >
            <AppContent />
        </ConfigProvider>
    );
}
