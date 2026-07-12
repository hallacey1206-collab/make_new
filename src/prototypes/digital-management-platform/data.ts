export const currentPlanYear = new Date().getFullYear();

export const planYearOptions = [
    { value: String(currentPlanYear), label: `${currentPlanYear}年` },
    { value: String(currentPlanYear + 1), label: `${currentPlanYear + 1}年` },
];

export type MenuPageId =
    | 'home'
    | 'plan-fill'
    | 'plan-review'
    | 'plan-view'
    | 'budget-fill'
    | 'budget-view'
    | 'budget-review'
    | 'budget-stat'
    | 'budget-plan-fill'
    | 'budget-plan-view'
    | 'budget-execution-fill'
    | 'budget-execution-stat'
    | 'project-filing'
    | 'project-execution'
    | 'filing-management'
    | 'execution-management'
    | 'project-change'
    | 'change-management'
    | 'project-post-eval'
    | 'post-eval-management'
    | 'supplier-eval'
    | 'expert-database'
    | 'resource-sharing'
    | 'filing-wecom-msg'
    | 'filing-wecom-detail';

export type PlanStatus = 'draft' | 'pending-review' | 'approved' | 'returned';

export type PlatformPlanRecord = {
    id: string;
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
    status: PlanStatus;
    creator: string;
    submitTime?: string;
    reviewTime?: string;
    reviewRemark?: string;
    reviewer?: string;
    updatedAt: string;
};

export type MenuChild = {
    id: MenuPageId;
    title: string;
    summary: string;
};

export type MenuGroup = {
    key: string;
    title: string;
    icon: string;
    children: MenuChild[];
};

export const companyOptions = [
    { value: '01', label: '01 | 天山材料' },
    { value: '02', label: '02 | 宁夏建材' },
    { value: '03', label: '03 | 北新建材' },
    { value: '04', label: '04 | 中国巨石' },
    { value: '05', label: '05 | 中材科技' },
    { value: '06', label: '06 | 中材国际' },
    { value: '07', label: '07 | 中建材投资' },
    { value: '08', label: '08 | 中建材石墨' },
    { value: '09', label: '09 | 中国建材总院' },
    { value: '10', label: '10 | 北新集团' },
    { value: '11', label: '11 | 凯盛科技' },
    { value: '12', label: '12 | 资产管理公司' },
    { value: '13', label: '13 | 中联投资' },
    { value: '14', label: '14 | 地勘中心' },
    { value: '15', label: '15 | 财务公司' },
    { value: '16', label: '16 | 中材节能' },
];

export const projectCategoryOptions = [
    { value: 'cat-1', label: `${currentPlanYear}年新增的项目` },
    { value: 'cat-2', label: `${currentPlanYear - 1}年预算内未开工的，${currentPlanYear}年开工的项目` },
    { value: 'cat-3', label: `${currentPlanYear - 1}年预算内开工的，${currentPlanYear}年续建的项目` },
    { value: 'cat-4', label: `已完工、已验收、已开票的，${currentPlanYear}年付款的项目` },
    { value: 'cat-5', label: `已完工，已验收、未开票的，${currentPlanYear}年开票、付款的项目` },
    { value: 'cat-6', label: `已完工、未验收、未开票的，${currentPlanYear}年验收、开票、付款的项目` },
];

export const businessDomainOptions = [
    '党建',
    '战略',
    '投资',
    '公司治理与改革',
    '国际化',
    '法治风控',
    '内部审计',
    '科研创新',
    '安全环保',
    '运营',
    '生产',
    '质量',
    '营销',
    '服务',
    '人力资源',
    '财务',
    '采购与供应链（含仓储）',
    '数字化',
    '其他',
].map((label, index) => ({
    value: String(index + 1).padStart(2, '0'),
    label: `${String(index + 1).padStart(2, '0')} | ${label}`,
}));

export const policyDirectionOptions = [
    { value: '01', label: '01 | 集团指导' },
    { value: '02', label: '02 | 国家指导' },
    { value: '03', label: '03 | 地方政府指导' },
    { value: '04', label: '04 | 无政策指导' },
];

export const buildModeOptions = [
    { value: '01', label: '01 | 集团统建' },
    { value: '02', label: '02 | 集团统筹' },
    { value: '03', label: '03 | 集团/股份二级企业统建' },
    { value: '04', label: '04 | 集团/股份二级企业统筹' },
    { value: '05', label: '05 | 单位自建' },
];

export const buildTypeOptions = [
    { value: '01', label: '01 | 新建' },
    { value: '02', label: '02 | 优化' },
    { value: '03', label: '03 | 运维' },
];

export const yesNoOptions = [
    { value: '01', label: '01 | 是' },
    { value: '02', label: '02 | 否' },
];

export const accountingOptions = [
    { value: '01', label: '01 | 无形资产' },
    { value: '02', label: '02 | 固定资产' },
    { value: '03', label: '03 | 费用化' },
];

export const menuGroups: MenuGroup[] = [
    {
        key: 'plan',
        title: '计划管理',
        icon: 'plan',
        children: [
            { id: 'plan-fill', title: '投资计划填报', summary: '新建、导入、保存与批量提交。' },
            { id: 'plan-review', title: '投资计划审核', summary: '按组织树审批下级单位计划。' },
            { id: 'plan-view', title: '投资计划查看', summary: '查看本单位已提交计划与状态。' },
        ],
    },
    {
        key: 'budget',
        title: '预算管理',
        icon: 'budget',
        children: [
            { id: 'budget-fill', title: '预算填报', summary: '预算草稿与提报入口。' },
            { id: 'budget-view', title: '预算查看', summary: '查询预算详情与关联状态。' },
            { id: 'budget-review', title: '预算审核', summary: '审批预算编制结果。' },
            { id: 'budget-stat', title: '预算统计', summary: '按单位统计预算执行情况。' },
            { id: 'budget-plan-fill', title: '预算计划填报', summary: '年度预算计划分解。' },
            { id: 'budget-plan-view', title: '预算计划查看', summary: '查看预算计划清单。' },
            { id: 'budget-execution-fill', title: '预算执行填报', summary: '填报预算执行进度。' },
            { id: 'budget-execution-stat', title: '预算执行统计', summary: '统计预算执行偏差与进度。' },
        ],
    },
    {
        key: 'project',
        title: '项目管理',
        icon: 'project',
        children: [
            { id: 'project-filing', title: '项目备案', summary: '项目备案与基础信息归档。' },
            { id: 'project-execution', title: '项目执行', summary: '项目执行过程管理。' },
            { id: 'filing-management', title: '备案管理', summary: '备案资料维护与校验。' },
            { id: 'execution-management', title: '执行管理', summary: '执行状态跟踪与提醒。' },
            { id: 'project-change', title: '项目变更', summary: '变更申请与审批。' },
            { id: 'change-management', title: '变更管理', summary: '变更台账与流程跟踪。' },
            { id: 'project-post-eval', title: '项目后评价', summary: '项目投后与成效评价。' },
            { id: 'post-eval-management', title: '后评价管理', summary: '后评价任务管理。' },
            { id: 'supplier-eval', title: '供应商评价', summary: '供应商画像与评分。' },
        ],
    },
    {
        key: 'resource',
        title: '资源库',
        icon: 'resource',
        children: [
            { id: 'expert-database', title: '专家库', summary: '专家信息维护与查询管理。' },
            { id: 'resource-sharing', title: '资源共享', summary: '模板、制度、附件集中共享。' },
            { id: 'filing-wecom-msg', title: '企微审批提醒', summary: '企微端备案审批消息提醒。' },
            { id: 'filing-wecom-detail', title: '企微审批详情', summary: '企微端备案审批详情H5页面。' },
        ],
    },
];

export const pageOrder: MenuPageId[] = [
    'home',
    'plan-fill',
    'plan-review',
    'plan-view',
    'budget-fill',
    'budget-view',
    'budget-review',
    'budget-stat',
    'budget-plan-fill',
    'budget-plan-view',
    'budget-execution-fill',
    'budget-execution-stat',
    'project-filing',
    'project-execution',
    'filing-management',
    'execution-management',
    'project-change',
    'change-management',
    'project-post-eval',
    'post-eval-management',
    'supplier-eval',
    'expert-database',
    'resource-sharing',
    'filing-wecom-msg',
    'filing-wecom-detail',
];

export const pageMeta: Record<MenuPageId, {
    title: string;
    group: string;
    summary: string;
}> = {
    home: {
        title: '首页',
        group: '总览',
        summary: '中国建材集团数字化管理平台',
    },
    'plan-fill': {
        title: '投资计划填报',
        group: '计划管理',
        summary: '支持逐条新增、模板导入、保存、编辑、删除与批量提交。',
    },
    'plan-review': {
        title: '投资计划审核',
        group: '计划管理',
        summary: '按组织树审批下级单位提交的投资计划。',
    },
    'plan-view': {
        title: '投资计划查看',
        group: '计划管理',
        summary: '查看当前单位已提交计划的详情与审核状态。',
    },
    'budget-fill': {
        title: '预算填报',
        group: '预算管理',
        summary: '预算填报模块的统一入口。',
    },
    'budget-view': {
        title: '预算查看',
        group: '预算管理',
        summary: '预算详情与状态查询入口。',
    },
    'budget-review': {
        title: '预算审核',
        group: '预算管理',
        summary: '预算审核与退回审批入口。',
    },
    'budget-stat': {
        title: '预算统计',
        group: '预算管理',
        summary: '预算汇总和执行偏差统计入口。',
    },
    'budget-plan-fill': {
        title: '预算计划填报',
        group: '预算管理',
        summary: '预算计划编制与分解入口。',
    },
    'budget-plan-view': {
        title: '预算计划查看',
        group: '预算管理',
        summary: '预算计划台账查看入口。',
    },
    'budget-execution-fill': {
        title: '预算执行填报',
        group: '预算管理',
        summary: '预算执行进度填报入口。',
    },
    'budget-execution-stat': {
        title: '预算执行统计',
        group: '预算管理',
        summary: '预算执行统计与偏差分析入口。',
    },
    'project-filing': {
        title: '项目备案',
        group: '项目管理',
        summary: '项目备案与登记入口。',
    },
    'project-execution': {
        title: '项目执行',
        group: '项目管理',
        summary: '项目执行过程管理入口。',
    },
    'filing-management': {
        title: '备案管理',
        group: '项目管理',
        summary: '备案台账和资料管理入口。',
    },
    'execution-management': {
        title: '执行管理',
        group: '项目管理',
        summary: '执行过程跟踪和提醒入口。',
    },
    'project-change': {
        title: '项目变更',
        group: '项目管理',
        summary: '项目变更申请与审批入口。',
    },
    'change-management': {
        title: '变更管理',
        group: '项目管理',
        summary: '变更台账和流程管理入口。',
    },
    'project-post-eval': {
        title: '项目后评价',
        group: '项目管理',
        summary: '项目后评价和复盘入口。',
    },
    'post-eval-management': {
        title: '后评价管理',
        group: '项目管理',
        summary: '后评价任务管理入口。',
    },
    'supplier-eval': {
        title: '供应商评价',
        group: '项目管理',
        summary: '供应商评价和评分管理入口。',
    },
    'expert-database': {
        title: '专家库',
        group: '资源库',
        summary: '专家信息维护与查询管理。',
    },
    'resource-sharing': {
        title: '资源共享',
        group: '资源库',
        summary: '模板、制度和附件统一共享入口。',
    },
    'filing-wecom-msg': {
        title: '企微审批提醒',
        group: '项目管理',
        summary: '企微端备案审批消息提醒列表。',
    },
    'filing-wecom-detail': {
        title: '企微审批详情',
        group: '项目管理',
        summary: '企微端备案审批详情H5页面。',
    },
};

export type OrgTreeNode = {
    title: string;
    key: string;
    children?: OrgTreeNode[];
};

// ============ 专家库相关类型与数据 ============

export type SpecialtyField =
    | '业务架构'
    | '应用架构'
    | '技术架构'
    | '数据架构'
    | '数字化治理'
    | '信息安全'
    | '人工智能';

export const specialtyFieldOptions: { value: SpecialtyField; label: string }[] = [
    { value: '业务架构', label: '业务架构' },
    { value: '应用架构', label: '应用架构' },
    { value: '技术架构', label: '技术架构' },
    { value: '数据架构', label: '数据架构' },
    { value: '数字化治理', label: '数字化治理' },
    { value: '信息安全', label: '信息安全' },
    { value: '人工智能', label: '人工智能' },
];

export type ExpertRecord = {
    id: string;
    userId: string;
    name: string;
    gender: string;
    birthDate: string;
    org: string;
    specialtyField: SpecialtyField;
    major: string;
    majorYears: number;
    createTime: string;
};

export type UserRecord = {
    id: string;
    name: string;
    gender: string;
    birthDate: string;
    org: string;
};

/** 模拟用户池（从用户表中选取人员时使用） */
export const USER_POOL: UserRecord[] = [
    { id: 'user-001', name: '张明远', gender: '男', birthDate: '1975-03', org: '中国建材总院' },
    { id: 'user-002', name: '李建华', gender: '男', birthDate: '1978-08', org: '中材国际' },
    { id: 'user-003', name: '王建国', gender: '男', birthDate: '1980-11', org: '凯盛科技' },
    { id: 'user-004', name: '赵文博', gender: '男', birthDate: '1976-05', org: '中国巨石' },
    { id: 'user-005', name: '陈志强', gender: '男', birthDate: '1982-02', org: '中材科技' },
    { id: 'user-006', name: '刘伟', gender: '男', birthDate: '1979-07', org: '中材国际' },
    { id: 'user-007', name: '孙丽', gender: '女', birthDate: '1983-09', org: '中国建材总院' },
    { id: 'user-008', name: '周涛', gender: '男', birthDate: '1977-04', org: '凯盛科技' },
    { id: 'user-009', name: '吴芳', gender: '女', birthDate: '1985-01', org: '中建材投资' },
    { id: 'user-010', name: '郑强', gender: '男', birthDate: '1981-06', org: '天山材料' },
    { id: 'user-011', name: '杨雪', gender: '女', birthDate: '1984-12', org: '北新建材' },
    { id: 'user-012', name: '马超', gender: '男', birthDate: '1974-10', org: '宁夏建材' },
    { id: 'user-013', name: '黄丽', gender: '女', birthDate: '1986-03', org: '中材节能' },
    { id: 'user-014', name: '宋刚', gender: '男', birthDate: '1978-07', org: '中联投资' },
    { id: 'user-015', name: '林涛', gender: '男', birthDate: '1980-05', org: '资产管理公司' },
    { id: 'user-016', name: '陈静', gender: '女', birthDate: '1987-08', org: '北新集团' },
    { id: 'user-017', name: '赵强', gender: '男', birthDate: '1973-11', org: '地勘中心' },
    { id: 'user-018', name: '王芳', gender: '女', birthDate: '1982-06', org: '财务公司' },
    { id: 'user-019', name: '李磊', gender: '男', birthDate: '1976-09', org: '天山材料' },
    { id: 'user-020', name: '张丽', gender: '女', birthDate: '1981-04', org: '中材国际' },
];

/** 初始专家库数据 */
export const initialExpertRecords: ExpertRecord[] = [
    {
        id: 'expert-001',
        userId: 'user-001',
        name: '张明远',
        gender: '男',
        birthDate: '1975-03',
        org: '中国建材总院',
        specialtyField: '业务架构',
        major: '信息系统管理',
        majorYears: 18,
        createTime: '2026-01-15 10:30',
    },
    {
        id: 'expert-002',
        userId: 'user-002',
        name: '李建华',
        gender: '男',
        birthDate: '1978-08',
        org: '中材国际',
        specialtyField: '应用架构',
        major: '软件工程',
        majorYears: 15,
        createTime: '2026-02-20 14:00',
    },
    {
        id: 'expert-003',
        userId: 'user-003',
        name: '王建国',
        gender: '男',
        birthDate: '1980-11',
        org: '凯盛科技',
        specialtyField: '信息安全',
        major: '网络空间安全',
        majorYears: 12,
        createTime: '2026-03-10 09:15',
    },
    {
        id: 'expert-004',
        userId: 'user-004',
        name: '赵文博',
        gender: '男',
        birthDate: '1976-05',
        org: '中国巨石',
        specialtyField: '人工智能',
        major: '计算机科学',
        majorYears: 10,
        createTime: '2026-04-05 16:45',
    },
    {
        id: 'expert-005',
        userId: 'user-005',
        name: '陈志强',
        gender: '男',
        birthDate: '1982-02',
        org: '中材科技',
        specialtyField: '数字化治理',
        major: '信息管理',
        majorYears: 14,
        createTime: '2026-05-18 11:20',
    },
];

export const orgTreeData: OrgTreeNode[] = [
    {
        title: '集团总部',
        key: 'group',
        children: [
            { title: '中建材投资', key: '07' },
            { title: '中国建材总院', key: '09' },
            { title: '凯盛科技', key: '11' },
            { title: '中国巨石', key: '15' },
            {
                title: '中国中材国际工程股份有限公司',
                key: '06',
                children: [
                    {
                        title: '中材国际（南京）',
                        key: '06-01',
                        children: [
                            { title: '中材宁锐（南京）国际物流有限公司', key: '06-01-01' },
                            { title: '浙江中材工程设计研究院有限公司', key: '06-01-02' },
                            { title: '苏州中材建设有限公司', key: '06-01-03' },
                            { title: '邯郸中材建设有限责任公司', key: '06-01-04' },
                        ],
                    },
                    {
                        title: '中国建材装备集团',
                        key: '06-02',
                        children: [
                            { title: '天津水泥工业设计研究院有限公司（合并）', key: '06-02-01' },
                            { title: '天津中材工程研究中心有限公司', key: '06-02-02' },
                            { title: 'CITEC印度尼西亚工程有限公司', key: '06-02-03' },
                            { title: '天津博本输送机械有限公司', key: '06-02-04' },
                            { title: '天津水泥技术杂志社', key: '06-02-05' },
                            { title: '中材（天津）粉体技术装备有限公司', key: '06-02-06' },
                            { title: '中材装备集团有限公司迪拜子公司', key: '06-02-07' },
                            { title: '中材（天津）控制工程有限公司', key: '06-02-08' },
                            { title: '中材国际工业工程（马）有限公司', key: '06-02-09' },
                        ],
                    },
                    {
                        title: '中建材（合肥）装备科技有限公司',
                        key: '06-03',
                        children: [
                            { title: '合肥中亚环保科技有限公司', key: '06-03-01' },
                            { title: '合肥固泰自动化有限公司', key: '06-03-02' },
                            { title: '中建材（合肥）粉体科技装备有限公司', key: '06-03-03' },
                            { title: '合肥中亚建材装备有限责任公司', key: '06-03-04' },
                            { title: '中建材（合肥）机电工程技术有限公司', key: '06-03-05' },
                            { title: '上饶中材机械有限公司', key: '06-03-06' },
                            { title: '河南中材环保有限公司', key: '06-03-07' },
                            { title: '中材（天津）重型机械有限公司', key: '06-03-08' },
                            { title: '中建材（徐州）重型机械有限公司（原', key: '06-03-09' },
                            { title: '唐山中材重型机械有限公司', key: '06-03-10' },
                            { title: '中建材（天津）工业服务有限公司（原', key: '06-03-11' },
                            { title: '合肥中都机械有限公司', key: '06-03-12' },
                            { title: '中建材（合肥）钢构科技有限公司', key: '06-03-13' },
                            { title: '湖北赛鸿新材料有限公司', key: '06-03-14' },
                            { title: '浙江博宇机电有限公司', key: '06-03-15' },
                        ],
                    },
                    {
                        title: '合肥水泥研究设计院有限公司',
                        key: '06-04',
                        children: [
                            { title: '江苏凯希盟科技有限公司', key: '06-04-01' },
                        ],
                    },
                    { title: '成都建筑材料工业设计研究院有限公司', key: '06-05' },
                    {
                        title: '中材矿山建设有限公司',
                        key: '06-06',
                        children: [
                            { title: '兖州中材建设有限公司', key: '06-06-01' },
                            { title: '中材矿山（南京）研究院有限公司', key: '06-06-02' },
                            { title: '天津矿山工程有限公司', key: '06-06-03' },
                            { title: '中国非金属材料南京矿山工程有限公司', key: '06-06-04' },
                            { title: '中材参天（重庆）新材料有限公司', key: '06-06-05' },
                            { title: '中国建筑材料工业建设西安工程有限公司', key: '06-06-06' },
                            { title: '中材建设有限公司', key: '06-06-07' },
                            { title: '中国中材海外科技发展有限公司', key: '06-06-08' },
                            { title: '中材国际智能科技有限公司', key: '06-06-09' },
                        ],
                    },
                    { title: '中材智能科技（成都）有限公司', key: '06-07' },
                    { title: '北京凯盛建材工程有限公司', key: '06-08' },
                    {
                        title: '中建材智慧工业科技有限公司',
                        key: '06-09',
                        children: [
                            { title: '安徽海金水泥技术发展股份有限公司', key: '06-09-01' },
                        ],
                    },
                    { title: '中建材智慧工业埃塞公司', key: '06-10' },
                    {
                        title: '中材国际环境工程（北京）有限公司',
                        key: '06-11',
                        children: [
                            { title: '杭州中材环保有限公司', key: '06-11-01' },
                            { title: '中材国际水务科技（合肥）有限公司', key: '06-11-02' },
                            { title: '溧阳中材环保有限公司', key: '06-11-03' },
                            { title: '临沂国建环境科技有限公司', key: '06-11-04' },
                            { title: '淮南中建材腾锋环保科技有限公司', key: '06-11-05' },
                            { title: '江苏中天共康环保科技有限公司', key: '06-11-06' },
                        ],
                    },
                ],
            },
        ],
    },
];

function buildBaseRecord(overrides: Partial<PlatformPlanRecord> & Pick<PlatformPlanRecord, 'id' | 'code' | 'name' | 'orgKey' | 'companyLevelTwo' | 'companyLevelThree' | 'unitName' | 'status'>): PlatformPlanRecord {
    const {
        id,
        code,
        name,
        orgKey,
        companyLevelTwo,
        companyLevelThree,
        unitName,
        status,
        ...rest
    } = overrides;
    const now = `${currentPlanYear}-06-24 09:30`;
    return {
        id,
        code,
        name,
        planYear: overrides.planYear || String(currentPlanYear),
        orgKey,
        companyLevelTwo,
        companyLevelThree,
        unitName,
        category: `${currentPlanYear}年新增的项目`,
        domain: '18',
        policyDirection: '01',
        policyName: '集团数字化专项规划',
        brief: '围绕年度数字化建设目标，完善计划填报、审核、查看和统计闭环。',
        goal: '提升投资计划可视化、标准化和联动预算能力。',
        buildMode: '02',
        buildType: '01',
        inPlan: '01',
        planningFileName: '集团数字化专项规划（2026版）',
        aiEnabled: '01',
        bigDataEnabled: '02',
        smartManufacturingEnabled: '02',
        includedInOtherInvestment: '02',
        otherInvestmentName: '无',
        startDate: `${currentPlanYear}-01-08`,
        endDate: `${currentPlanYear}-12-20`,
        accountingSubject: '01',
        selfFunding: 120,
        externalFunding: 80,
        otherFunding: 30,
        softwareFunding: 90,
        hardwareFunding: 70,
        otherTechFunding: 70,
        status,
        creator: '计划管理员',
        updatedAt: now,
        ...rest,
    };
}

export const initialPlanRecords: PlatformPlanRecord[] = [
    buildBaseRecord({
        id: 'plan-001',
        code: `JH-ZCGJ-${currentPlanYear}-0001`,
        name: '中材南京年度数字化平台整合计划',
        orgKey: '06-01',
        companyLevelTwo: '06-01 | 中材国际（南京）',
        companyLevelThree: '中材国际（南京）',
        unitName: '信息化管理部',
        status: 'draft',
    }),
    buildBaseRecord({
        id: 'plan-002',
        code: `JH-ZCGJ-${currentPlanYear}-0002`,
        name: '中国建材装备集团协同能力提升计划',
        orgKey: '06-02',
        companyLevelTwo: '06-02 | 中国建材装备集团',
        companyLevelThree: '中国建材装备集团',
        unitName: '数字化中心',
        category: `${currentPlanYear}年预算内未开工的，${currentPlanYear}年开工的项目`,
        buildMode: '03',
        buildType: '02',
        status: 'returned',
        reviewRemark: '请补充立项依据、规划文件名称和预算拆分明细。',
        reviewer: '王审核',
        reviewTime: `${currentPlanYear}-06-20 15:15`,
    }),
    buildBaseRecord({
        id: 'plan-003',
        code: `JH-ZCGJ-${currentPlanYear}-0003`,
        name: '合肥装备科技智能制造数据看板计划',
        orgKey: '06-03',
        companyLevelTwo: '06-03 | 中建材（合肥）装备科技有限公司',
        companyLevelThree: '中建材（合肥）装备科技有限公司',
        unitName: '运营管理部',
        category: `${currentPlanYear}年预算内开工的，${currentPlanYear}年续建的项目`,
        bigDataEnabled: '01',
        status: 'draft',
    }),
    buildBaseRecord({
        id: 'plan-004',
        code: `JH-ZCGJ-${currentPlanYear}-0004`,
        name: '合肥水泥研究院预算联动计划',
        orgKey: '06-04',
        companyLevelTwo: '06-04 | 合肥水泥研究设计院有限公司',
        companyLevelThree: '合肥水泥研究设计院有限公司',
        unitName: '中国巨石',
        buildMode: '01',
        status: 'pending-review',
        submitTime: `${currentPlanYear}-06-20 10:08`,
    }),
    buildBaseRecord({
        id: 'plan-005',
        code: `JH-ZCGJ-${currentPlanYear}-0005`,
        name: '成都建材院数字底座优化计划',
        orgKey: '06-05',
        companyLevelTwo: '06-05 | 成都建筑材料工业设计研究院有限公司',
        companyLevelThree: '成都建筑材料工业设计研究院有限公司',
        unitName: '中材国际',
        category: `${currentPlanYear}年新增的项目`,
        buildType: '02',
        status: 'pending-review',
        submitTime: `${currentPlanYear}-06-21 09:40`,
    }),
    buildBaseRecord({
        id: 'plan-006',
        code: `JH-ZCGJ-${currentPlanYear}-0006`,
        name: '中材国际工地协同执行计划',
        orgKey: '06',
        companyLevelTwo: '06 | 中材国际',
        companyLevelThree: '中材国际股份有限公司',
        unitName: '项目管理部',
        status: 'approved',
        submitTime: `${currentPlanYear}-06-10 08:45`,
        reviewTime: `${currentPlanYear}-06-12 14:30`,
        reviewer: '李审核',
        reviewRemark: '同意执行，注意按季度跟踪预算。',
    }),
    buildBaseRecord({
        id: 'plan-007',
        code: `JH-ZCGJ-${currentPlanYear}-0007`,
        name: '凯盛科技共享资源沉淀计划',
        orgKey: '11',
        companyLevelTwo: '11 | 凯盛科技',
        companyLevelThree: '凯盛科技股份有限公司',
        unitName: '数字化管理部',
        status: 'approved',
        submitTime: `${currentPlanYear}-06-09 11:20`,
        reviewTime: `${currentPlanYear}-06-11 16:05`,
        reviewer: '李审核',
        reviewRemark: '已通过，建议补充接口清单。',
    }),
    buildBaseRecord({
        id: 'plan-008',
        code: `JH-ZCGJ-${currentPlanYear}-0008`,
        name: '财务公司年度投资收口计划',
        orgKey: '15',
        companyLevelTwo: '15 | 中国巨石',
        companyLevelThree: '中国巨石',
        unitName: '计划财务部',
        status: 'approved',
        submitTime: `${currentPlanYear}-06-08 13:12`,
        reviewTime: `${currentPlanYear}-06-10 17:20`,
        reviewer: '李审核',
        reviewRemark: '通过，建议后续按月更新执行数据。',
    }),
    buildBaseRecord({
        id: 'plan-009',
        code: `JH-ZCGJ-${currentPlanYear}-0009`,
        name: '中建材投资供应链数据平台计划',
        orgKey: '07',
        companyLevelTwo: '07 | 中建材投资',
        companyLevelThree: '中建材投资',
        unitName: '投资管理部',
        status: 'pending-review',
        submitTime: `${currentPlanYear}-06-19 14:30`,
    }),
    buildBaseRecord({
        id: 'plan-010',
        code: `JH-ZCGJ-${currentPlanYear}-0010`,
        name: '中国建材总院科研管理数字化计划',
        orgKey: '09',
        companyLevelTwo: '09 | 中国建材总院',
        companyLevelThree: '中国建材总院',
        unitName: '科技发展部',
        status: 'pending-review',
        submitTime: `${currentPlanYear}-06-21 08:15`,
    }),
    buildBaseRecord({
        id: 'plan-011',
        code: `JH-ZCGJ-${currentPlanYear}-0011`,
        name: '凯盛科技智能制造升级计划',
        orgKey: '11',
        companyLevelTwo: '11 | 凯盛科技',
        companyLevelThree: '凯盛科技股份有限公司',
        unitName: '智能制造部',
        status: 'pending-review',
        submitTime: `${currentPlanYear}-06-18 16:45`,
    }),
    buildBaseRecord({
        id: 'plan-012',
        code: `JH-ZCGJ-${currentPlanYear}-0012`,
        name: '中国巨石玻纤产线数字化计划',
        orgKey: '15',
        companyLevelTwo: '15 | 中国巨石',
        companyLevelThree: '中国巨石',
        unitName: '信息中心',
        status: 'pending-review',
        submitTime: `${currentPlanYear}-06-22 10:00`,
    }),
    buildBaseRecord({
        id: 'plan-013',
        code: `JH-ZCGJ-${currentPlanYear}-0013`,
        name: '中建材投资境外项目管理系统计划',
        orgKey: '07',
        companyLevelTwo: '07 | 中建材投资',
        companyLevelThree: '中建材投资',
        unitName: '海外事业部',
        category: `${currentPlanYear}年新增的项目`,
        status: 'pending-review',
        submitTime: `${currentPlanYear}-06-20 11:20`,
    }),
    buildBaseRecord({
        id: 'plan-014',
        code: `JH-ZCGJ-${currentPlanYear}-0014`,
        name: '中国巨石物流仓储智能化计划',
        orgKey: '15',
        companyLevelTwo: '15 | 中国巨石',
        companyLevelThree: '中国巨石',
        unitName: '供应链管理部',
        category: `${currentPlanYear}年预算内开工的，${currentPlanYear}年续建的项目`,
        status: 'pending-review',
        submitTime: `${currentPlanYear}-06-23 09:00`,
    }),
];

// ============ 预算填报相关类型与数据 ============

export type BudgetStatus = 'draft' | 'pending-review' | 'approved' | 'returned';

export type BudgetTabType = 'inner' | 'outer';

export type BudgetRecord = {
    id: string;
    budgetCode: string;
    linkedToInvestmentPlan: string;
    investmentPlanName: string;
    projectName: string;
    budgetCategory: string;
    unitName: string;
    enterpriseType: string;
    fiveMeasuresCategory: string;
    measureSubItem: string;
    businessDomain: string;
    fiveTransformation: string;
    projectGoal: string;
    goalContent: string;
    buildMode: string;
    buildType: string;
    accountingSubject: string;
    managedDept: string;
    responsiblePerson: string;
    projectCategory: string;
    projectBrief: string;
    supportSecondCurve: string;
    planProgress: string;
    includedInOtherBudget: string;
    otherBudgetName: string;
    startDate: string;
    endDate: string;
    totalInvestment: number;
    selfFunding: number;
    externalFunding: number;
    otherFunding: number;
    softwareFunding: number;
    hardwareFunding: number;
    otherTechFunding: number;
    tabType: BudgetTabType;
    status: BudgetStatus;
    version: string;
    creator: string;
    submitTime?: string;
    reviewTime?: string;
    reviewRemark?: string;
    reviewer?: string;
    updatedAt: string;
};

export const budgetCategoryOptions = [
    { value: '01', label: '01 | 项目类' },
    { value: '02', label: '02 | 非项目类' },
];

export const enterpriseTypeOptions = [
    { value: '01', label: '01 | 集团/股份总部(集团)' },
    { value: '02', label: '02 | 基础建材' },
    { value: '03', label: '03 | 新材料' },
    { value: '04', label: '04 | 工程服务' },
    { value: '05', label: '05 | 物流贸易(集团)' },
];

export const fiveMeasuresCategoryOptions = [
    { value: '0101', label: '0101 | 国有资本做强做优做大(集团)' },
    { value: '0102', label: '0102 | 管理体系协同高效(集团)' },
    { value: '0103', label: '0103 | 监管体系全局贯通(集团)' },
    { value: '0104', label: '0104 | 生产链条转型升级(集团)' },
    { value: '0105', label: '0105 | 数字服务能力培养(集团)' },
    { value: '0106', label: '0106 | 数字化治理体系变革' },
    { value: '0107', label: '0107 | 数据治理体系变革' },
    { value: '0108', label: '0108 | 管理流程变革' },
    { value: '0109', label: '0109 | 数字底座' },
    { value: '0201', label: '0201 | 管理体系标准引领(基础建材)' },
    { value: '0202', label: '0202 | 监管体系透明贯通(基础建材)' },
    { value: '0203', label: '0203 | 供销服高效协同(基础建材)' },
    { value: '0204', label: '0204 | 生产制造提质降本增效(基础建材)' },
    { value: '0205', label: '0205 | 产业资源共享服务平台(基础建材)' },
    { value: '0206', label: '0206 | 数字化治理体系变革' },
    { value: '0207', label: '0207 | 数据治理体系变革' },
    { value: '0208', label: '0208 | 管理流程变革' },
    { value: '0209', label: '0209 | 数字底座' },
    { value: '0301', label: '0301 | 管理体系智能精益(新材料)' },
    { value: '0302', label: '0302 | 监管体系透明贯通(新材料)' },
    { value: '0303', label: '0303 | 产业发展创新培育(新材料)' },
    { value: '0304', label: '0304 | 生产运营优化升级(新材料)' },
    { value: '0305', label: '0305 | 产业链数字服务平台(新材料)' },
    { value: '0306', label: '0306 | 数字化治理体系变革' },
    { value: '0307', label: '0307 | 数据治理体系变革' },
    { value: '0308', label: '0308 | 管理流程变革' },
    { value: '0309', label: '0309 | 数字底座' },
    { value: '0401', label: '0401 | 客户服务体验提升(工程服务)' },
    { value: '0402', label: '0402 | 主营业务智能升级(工程服务)' },
    { value: '0403', label: '0403 | 管理体系精细高效(工程服务)' },
    { value: '0404', label: '0404 | 监管体系透明贯通(工程服务)' },
    { value: '0405', label: '0405 | 数字化服务增值平台(工程服务)' },
    { value: '0406', label: '0406 | 数字化治理体系变革' },
    { value: '0407', label: '0407 | 数据治理体系变革' },
    { value: '0408', label: '0408 | 管理流程变革' },
    { value: '0409', label: '0409 | 数字底座' },
    { value: '0501', label: '0501 | 国有资本做强做优做大(集团)' },
    { value: '0502', label: '0502 | 管理体系协同高效(集团)' },
    { value: '0503', label: '0503 | 监管体系全局贯通(集团)' },
    { value: '0504', label: '0504 | 生产链条转型升级(集团)' },
    { value: '0505', label: '0505 | 数字服务能力培养(集团)' },
    { value: '0506', label: '0506 | 数字化治理体系变革' },
    { value: '0507', label: '0507 | 数据治理体系变革' },
    { value: '0508', label: '0508 | 管理流程变革' },
    { value: '0509', label: '0509 | 数字底座' },
];

export const measureSubItemCascadeMap: Record<string, Array<{ value: string; label: string }>> = {
    '0101': [
        { value: '010101', label: '010101 | 行业分析数字化' },
        { value: '010102', label: '010102 | 投资管理数字化' },
    ],
    '0102': [
        { value: '010201', label: '010201 | 经营管理过程数字化' },
        { value: '010202', label: '010202 | 经营管理分析决策数字化' },
    ],
    '0103': [
        { value: '010301', label: '010301 | 全级次监管数字化' },
        { value: '010302', label: '010302 | 监管分析决策数字化' },
    ],
    '0104': [
        { value: '010401', label: '010401 | 研产供销服数字化' },
        { value: '010402', label: '010402 | 绿色发展数字化' },
        { value: '010403', label: '010403 | 主业供销赋能数字化' },
    ],
    '0105': [
        { value: '010501', label: '010501 | 产业化数字服务能力' },
        { value: '010502', label: '010502 | 产融服务能力' },
    ],
    '0106': [{ value: '0106', label: '0106 | 数字化治理体系变革' }],
    '0107': [{ value: '0107', label: '0107 | 数据治理体系变革' }],
    '0108': [{ value: '0108', label: '0108 | 管理流程变革' }],
    '0109': [{ value: '0109', label: '0109 | 数字底座' }],
    '0201': [
        { value: '020101', label: '020101 | 经营管理过程数字化' },
        { value: '020102', label: '020102 | 经营管理分析决策数字化' },
    ],
    '0202': [
        { value: '020201', label: '020201 | 监管过程数字化' },
        { value: '020202', label: '020202 | 监管分析决策数字化' },
    ],
    '0203': [
        { value: '020301', label: '020301 | 供应链数字化' },
        { value: '020302', label: '020302 | 敏捷服务智能化' },
    ],
    '0204': [
        { value: '020401', label: '020401 | 生产数字化' },
        { value: '020402', label: '020402 | 绿色发展数字化' },
    ],
    '0205': [{ value: '020501', label: '020501 | 平台化服务能力' }],
    '0206': [{ value: '0206', label: '0206 | 数字化治理体系变革' }],
    '0207': [{ value: '0207', label: '0207 | 数据治理体系变革' }],
    '0208': [{ value: '0208', label: '0208 | 管理流程变革' }],
    '0209': [{ value: '0209', label: '0209 | 数字底座' }],
    '0301': [
        { value: '030101', label: '030101 | 经营管理数字化' },
    ],
    '0302': [
        { value: '030201', label: '030201 | 监督管理一体化' },
        { value: '030202', label: '030202 | 监督决策数字化' },
    ],
    '0303': [
        { value: '030301', label: '030301 | 研发设计数字化' },
        { value: '030302', label: '030302 | 成果转化数字化' },
        { value: '030303', label: '030303 | 产品开发集成化' },
    ],
    '0304': [
        { value: '030401', label: '030401 | 生产运营智能化' },
        { value: '030402', label: '030402 | 绿色发展数字化' },
    ],
    '0305': [
        { value: '030501', label: '030501 | 服务产品化能力' },
        { value: '030502', label: '030502 | 行业资源共享能力' },
    ],
    '0306': [{ value: '0306', label: '0306 | 数字化治理体系变革' }],
    '0307': [{ value: '0307', label: '0307 | 数据治理体系变革' }],
    '0308': [{ value: '0308', label: '0308 | 管理流程变革' }],
    '0309': [{ value: '0309', label: '0309 | 数字底座' }],
    '0401': [
        { value: '040101', label: '040101 | 客户需求定制化' },
        { value: '040102', label: '040102 | 客户管理全面化' },
    ],
    '0402': [
        { value: '040201', label: '040201 | 研发设计一体化' },
        { value: '040202', label: '040202 | 装备高端化' },
        { value: '040203', label: '040203 | 采购智能化' },
        { value: '040204', label: '040204 | 工厂智能化' },
        { value: '040205', label: '040205 | 工程建造智能化' },
        { value: '040206', label: '040206 | 工厂运维智能化' },
        { value: '040207', label: '040207 | EPC与装备制造协同化' },
        { value: '040208', label: '040208 | 业务板块间协同化' },
        { value: '040209', label: '040209 | 资源管理智能化' },
        { value: '040210', label: '040210 | 项目全周期数字化' },
    ],
    '0403': [
        { value: '040301', label: '040301 | 经营管理协同化' },
        { value: '040302', label: '040302 | 经营决策数字化' },
    ],
    '0404': [
        { value: '040401', label: '040401 | 监督管理一体化' },
        { value: '040402', label: '040402 | 监督决策数字化' },
    ],
    '0405': [
        { value: '040501', label: '040501 | 智慧矿山增值服务能力' },
        { value: '040502', label: '040502 | 智能制造增值服务能力' },
        { value: '040503', label: '040503 | 智能装备增值服务能力' },
    ],
    '0406': [{ value: '0406', label: '0406 | 数字化治理体系变革' }],
    '0407': [{ value: '0407', label: '0407 | 数据治理体系变革' }],
    '0408': [{ value: '0408', label: '0408 | 管理流程变革' }],
    '0409': [{ value: '0409', label: '0409 | 数字底座' }],
    '0501': [
        { value: '050101', label: '050101 | 行业分析数字化' },
        { value: '050102', label: '050102 | 投资管理数字化' },
    ],
    '0502': [
        { value: '050201', label: '050201 | 经营管理过程数字化' },
        { value: '050202', label: '050202 | 经营管理分析决策数字化' },
    ],
    '0503': [
        { value: '050301', label: '050301 | 全级次监管数字化' },
        { value: '050302', label: '050302 | 监管分析决策数字化' },
    ],
    '0504': [
        { value: '050401', label: '050401 | 研产供销服数字化' },
        { value: '050402', label: '050402 | 绿色发展数字化' },
        { value: '050403', label: '050403 | 主业供销赋能数字化' },
    ],
    '0505': [
        { value: '050501', label: '050501 | 产业化数字服务能力' },
        { value: '050502', label: '050502 | 产融服务能力' },
    ],
    '0506': [{ value: '0506', label: '0506 | 数字化治理体系变革' }],
    '0507': [{ value: '0507', label: '0507 | 数据治理体系变革' }],
    '0508': [{ value: '0508', label: '0508 | 管理流程变革' }],
    '0509': [{ value: '0509', label: '0509 | 数字底座' }],
};

export const budgetBusinessDomainOptions = [
    { value: '01', label: '01 | 党建工作' },
    { value: '02', label: '02 | 战略管理' },
    { value: '03', label: '03 | 资本投资' },
    { value: '04', label: '04 | 公司治理与改革' },
    { value: '05', label: '05 | 国际化发展' },
    { value: '06', label: '06 | 法治风控' },
    { value: '07', label: '07 | 内部审计' },
    { value: '08', label: '08 | 纪检监察' },
    { value: '09', label: '09 | 巡视巡察' },
    { value: '10', label: '10 | 科研创新' },
    { value: '11', label: '11 | 安全环保' },
    { value: '12', label: '12 | 运营管理' },
    { value: '13', label: '13 | 生产管理' },
    { value: '14', label: '14 | 营销管理' },
    { value: '15', label: '15 | 服务管理' },
    { value: '16', label: '16 | 人力资源管理' },
    { value: '17', label: '17 | 财务管理' },
    { value: '18', label: '18 | 采购与供应链' },
    { value: '19', label: '19 | 数字化管理' },
    { value: '20', label: '20 | 决策支持与综合服务' },
    { value: '21', label: '21 | 基础建材业务运营' },
    { value: '22', label: '22 | 新材料业务运营' },
    { value: '23', label: '23 | 工程服务业务运营' },
    { value: '24', label: '24 | 物流贸易业务运营' },
];

export const fiveTransformationOptions = [
    { value: 'YF', label: 'YF | 研发数字化' },
    { value: 'JY', label: 'JY | 经营一体化' },
    { value: 'SC', label: 'SC | 生产智能化' },
    { value: 'FW', label: 'FW | 服务敏捷化' },
    { value: 'CY', label: 'CY | 产业生态化' },
];

export const projectGoalOptions = [
    { value: '1', label: '1 | 降低成本' },
    { value: '2', label: '2 | 提高效率' },
    { value: '3', label: '3 | 提升质量' },
    { value: '4', label: '4 | 自主可控' },
    { value: '5', label: '5 | 网络安全' },
    { value: '6', label: '6 | 社会责任' },
    { value: '7', label: '7 | 变革创新' },
];

export const budgetBuildTypeOptions = [
    { value: '01', label: '01 | 新建' },
    { value: '02', label: '02 | 优化' },
    { value: '03', label: '03 | 运维' },
    { value: '04', label: '04 | 在建' },
];

export const planProgressOptions = [
    { value: '01', label: '01 | 需求分析' },
    { value: '02', label: '02 | 初步设计' },
    { value: '03', label: '03 | 详细设计' },
    { value: '04', label: '04 | 开发' },
    { value: '05', label: '05 | 测试' },
    { value: '06', label: '06 | 试运行' },
    { value: '07', label: '07 | 上线' },
    { value: '08', label: '08 | 上线验收' },
];

export const budgetProjectCategoryOptions = [
    { value: '1', label: `${currentPlanYear}年新增的项目` },
    { value: '2', label: `${currentPlanYear - 1}年预算内未开工的，${currentPlanYear}年开工的项目` },
    { value: '3', label: `${currentPlanYear - 1}年预算内开工的，${currentPlanYear}年续建的项目` },
    { value: '4', label: `已完工、已验收、已开票的，${currentPlanYear}年付款的项目` },
    { value: '5', label: `已完工，已验收、未开票的，${currentPlanYear}年开票、付款的项目` },
    { value: '6', label: `已完工、未验收、未开票的，${currentPlanYear}年验收、开票、付款的项目` },
];

const budgetStatusMeta: Record<BudgetStatus, { label: string; color: string }> = {
    draft: { label: '草稿', color: 'default' },
    'pending-review': { label: '待审核', color: 'processing' },
    approved: { label: '通过', color: 'success' },
    returned: { label: '退回', color: 'error' },
};

function buildBaseBudgetRecord(overrides: Partial<BudgetRecord> & Pick<BudgetRecord, 'id' | 'budgetCode' | 'projectName' | 'unitName' | 'tabType' | 'status'>): BudgetRecord {
    const {
        id,
        budgetCode,
        projectName,
        unitName,
        tabType,
        status,
        ...rest
    } = overrides;
    const now = `${currentPlanYear}-06-24 09:30`;
    return {
        id,
        budgetCode,
        linkedToInvestmentPlan: '01',
        investmentPlanName: '集团数字化专项投资计划',
        projectName,
        budgetCategory: '01',
        unitName,
        enterpriseType: '01',
        fiveMeasuresCategory: '0101',
        measureSubItem: '010101',
        businessDomain: '19',
        fiveTransformation: 'JY',
        projectGoal: '2',
        goalContent: '提升预算编制效率与数据准确性',
        buildMode: '02',
        buildType: '01',
        accountingSubject: '01',
        managedDept: '数字化管理部',
        responsiblePerson: '张明远',
        projectCategory: '1',
        projectBrief: '预算编制与管理数字化建设，实现统一预算口径、自动关联投资计划与预算执行数据。涵盖预算上报、审核、统计全流程。',
        supportSecondCurve: '02',
        planProgress: '04',
        includedInOtherBudget: '02',
        otherBudgetName: '',
        startDate: `${currentPlanYear}-01-08`,
        endDate: `${currentPlanYear}-12-20`,
        totalInvestment: 350,
        selfFunding: 200,
        externalFunding: 100,
        otherFunding: 50,
        softwareFunding: 180,
        hardwareFunding: 100,
        otherTechFunding: 70,
        tabType,
        status,
        version: 'V1.0',
        creator: '预算管理员',
        updatedAt: now,
        ...rest,
    };
}

export const initialBudgetRecords: BudgetRecord[] = [
    buildBaseBudgetRecord({
        id: 'budget-001',
        budgetCode: `YS-ZCGJ-${currentPlanYear}-0001`,
        projectName: '中材南京年度预算一体化平台建设',
        unitName: '信息化管理部',
        tabType: 'inner',
        status: 'draft',
    }),
    buildBaseBudgetRecord({
        id: 'budget-002',
        budgetCode: `YS-ZCGJ-${currentPlanYear}-0002`,
        projectName: '中国建材装备集团协同能力预算优化',
        unitName: '数字化中心',
        tabType: 'inner',
        status: 'returned',
        reviewRemark: '请补充预算拆分明细和关联投资计划。',
        reviewer: '王审核',
        reviewTime: `${currentPlanYear}-06-20 15:15`,
    }),
    buildBaseBudgetRecord({
        id: 'budget-003',
        budgetCode: `YS-ZCGJ-${currentPlanYear}-0003`,
        projectName: '合肥装备科技智能制造数据看板预算',
        unitName: '运营管理部',
        tabType: 'inner',
        enterpriseType: '04',
        status: 'draft',
    }),
    buildBaseBudgetRecord({
        id: 'budget-004',
        budgetCode: `YS-ZCGJ-${currentPlanYear}-0004`,
        projectName: '凯盛科技共享资源沉淀平台预算外项目',
        unitName: '数字化管理部',
        tabType: 'outer',
        linkedToInvestmentPlan: '02',
        investmentPlanName: '',
        enterpriseType: '01',
        status: 'draft',
    }),
    buildBaseBudgetRecord({
        id: 'budget-005',
        budgetCode: `YS-ZCGJ-${currentPlanYear}-0005`,
        projectName: '财务公司年度预算收口管理项目',
        unitName: '计划财务部',
        tabType: 'inner',
        status: 'pending-review',
        submitTime: `${currentPlanYear}-06-20 10:08`,
    }),
];

export function getNextBudgetCode(sequence: number) {
    return `YS-ZCGJ-${currentPlanYear}-${String(sequence).padStart(4, '0')}`;
}

export function getNextBudgetVersion(sequence: number) {
    return `V${String(sequence).padStart(1, '0')}.0`;
}

export { budgetStatusMeta };

export function getBudgetStatusLabel(status: BudgetStatus): string {
    return budgetStatusMeta[status]?.label || status;
}

export function getBudgetStatusColor(status: BudgetStatus): string {
    return budgetStatusMeta[status]?.color || 'default';
}

export function getNextPlanCode(sequence: number) {
    return `JH-ZCGJ-${currentPlanYear}-${String(sequence).padStart(4, '0')}`;
}
