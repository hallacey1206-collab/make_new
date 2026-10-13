/**
 * 操作手册页面
 * 左侧功能目录 + 右侧 Markdown 操作介绍
 */
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import postEvalDetailImg from './assets/post-eval-detail.png';
import postEvalMgmtListImg from './assets/post-eval-mgmt-list.png';
import expertDatabaseListImg from './assets/expert-database-list.png';
import resourceSharingListImg from './assets/resource-sharing-list.png';
import planFillListImg from './assets/plan-fill-list.png';
import planFillNewImg from './assets/plan-fill-new.png';
import planReviewListImg from './assets/plan-review-list.png';
import budgetReviewListImg from './assets/budget-review-list.png';
import budgetPlanFillDetailImg from './assets/budget-plan-fill-detail.png';
import budgetPlanViewDetailImg from './assets/budget-plan-view-detail.png';
import budgetExecutionFillListImg from './assets/budget-execution-fill-list.png';
import budgetExecutionFillDetailImg from './assets/budget-execution-fill-detail.png';
import budgetExecutionViewListImg from './assets/budget-execution-view-list.png';
import projectFilingBudgetSelectImg from './assets/project-filing-budget-select.png';
import projectFilingDetailImg from './assets/project-filing-detail.png';
import projectExecutionListImg from './assets/project-execution-list.png';
import projectExecutionDetailImg from './assets/project-execution-detail.png';
import projectChangeListImg from './assets/project-change-list.png';
import projectChangeDetailImg from './assets/project-change-detail.png';
import changeMgmtListImg from './assets/change-mgmt-list.png';
import changeMgmtDetailImg from './assets/change-mgmt-detail.png';
import supplierEvalDetailImg from './assets/supplier-eval-detail.png';
import loginAccountImg from './assets/login-account.png';
import loginQrcodeImg from './assets/login-qrcode.png';
import loginWecomSsoImg from './assets/login-wecom-sso.png';
import loginWecomWorkspaceImg from './assets/login-wecom-workspace.png';
import navigationStructureImg from './assets/navigation-structure.png';
import filingMgmtListImg from './assets/filing-mgmt-list.png';
import filingMgmtDetailImg from './assets/filing-mgmt-detail.png';
import filingMgmtNodesImg from './assets/filing-mgmt-nodes.png';
import filingMgmtExpertImg from './assets/filing-mgmt-expert.png';
import {
    BookOutlined,
    SearchOutlined,
    FileTextOutlined,
    CaretDownOutlined,
    CaretRightOutlined,
    HomeOutlined,
    ScheduleOutlined,
    AccountBookOutlined,
    ProjectOutlined,
    FolderOpenOutlined,
    TeamOutlined,
    QuestionCircleOutlined,
    InfoCircleOutlined,
    SettingOutlined,
    SafetyCertificateOutlined,
    AppstoreOutlined,
    DatabaseOutlined,
} from '@ant-design/icons';

/* ============ 目录数据结构 ============ */

interface DocSection {
    id: string;
    title: string;
    icon?: React.ReactNode;
    children?: DocSection[];
    content?: DocContent;
}

interface DocContent {
    title: string;
    description: string;
    sections: DocContentSection[];
}

interface DocContentSection {
    id: string;
    title: string;
    body: React.ReactNode;
}

/* ============ 操作手册内容数据 ============ */

const ICON_COLOR = '#6366f1';

const docSections: DocSection[] = [
    {
        id: 'getting-started',
        title: '快速入门',
        icon: <HomeOutlined style={{ color: ICON_COLOR }} />,
        children: [
            {
                id: 'platform-intro',
                title: '平台简介',
                content: {
                    title: '平台简介',
                    description: '了解数字化管理平台的核心能力与产品矩阵。',
                    sections: [
                        {
                            id: 'overview',
                            title: '概述',
                            body: (
                                <div>
                                    <p>数字化管理平台是中国建材集团为提升投资决策效率、加强项目全生命周期管控而打造的一体化管理系统。平台覆盖投资计划、预算管理、项目执行等核心业务领域，为集团各级单位提供统一的数字化工作入口。</p>
                                    <p>平台采用"集团-板块-企业"三级架构设计，支持多层级组织权限管控，确保数据安全与审批合规。通过标准化的业务流程与数据模型，实现投资管理全链条的在线化、透明化和智能化。</p>
                                </div>
                            ),
                        },
                        {
                            id: 'core-products',
                            title: '核心产品矩阵',
                            body: (
                                <div>
                                    <p>平台由四大核心模块构成：</p>
                                    <ul>
                                        <li><strong>计划管理</strong> — 投资计划的填报、审核与查看，支持逐条新增与模板批量导入</li>
                                        <li><strong>预算管理</strong> — 预算编制、审批、执行填报与偏差统计的全流程管控</li>
                                        <li><strong>项目管理</strong> — 项目备案、执行跟踪、变更管理及后评价的闭环管理</li>
                                        <li><strong>资源库</strong> — 专家库维护与资源共享，为业务决策提供智力支撑</li>
                                    </ul>
                                </div>
                            ),
                        },
                        {
                            id: 'user-roles',
                            title: '用户角色说明',
                            body: (
                                <div>
                                    <p>平台根据业务职责划分以下用户角色：</p>
                                    <ul>
                                        <li>
                                            <strong>预算、投资计划审核人员</strong>
                                            <ol>
                                                <li>审核本级及下级企业的数字化投资计划、预算填报内容</li>
                                                <li>审核本级及下级企业的数字化预算执行情况填报信息</li>
                                                <li>审核本级及下级企业的数字化预算计划</li>
                                                <li>查看本级及下级企业的数字化投资计划、预算统计信息</li>
                                            </ol>
                                        </li>
                                        <li>
                                            <strong>预算、投资计划填报人员</strong>
                                            <ol>
                                                <li>填报本单位数字化投资计划、预算的详细信息</li>
                                                <li>填报本单位数字化预算执行情况的详细信息</li>
                                                <li>填报本单位的数字化预算计划</li>
                                                <li>查看本单位的数字化投资计划、预算统计信息</li>
                                            </ol>
                                        </li>
                                        <li>
                                            <strong>项目审核人员</strong>
                                            <ol>
                                                <li>审核本级及下级企业的数字化项目备案的详细内容</li>
                                                <li>审核本级及下级企业数字化项目执行情况</li>
                                                <li>审核本级及下级企业的数字化项目变更详细信息</li>
                                                <li>查看本级及下级企业的数字化项目后评价和供应商评价信息</li>
                                            </ol>
                                        </li>
                                        <li>
                                            <strong>项目填报人员</strong>
                                            <ol>
                                                <li>填报本单位数字化项目备案的详细信息</li>
                                                <li>填报本单位数字化项目执行详细信息和上传材料</li>
                                                <li>填报本单位数字化项目变更的详细信息</li>
                                                <li>填报本单位数字化项目的后评价和供应商评价信息</li>
                                            </ol>
                                        </li>
                                        <li>
                                            <strong>数字化部门负责人</strong>
                                            <ol>
                                                <li>查看所有单位的投资计划信息</li>
                                                <li>查看所有单位的预算信息</li>
                                                <li>查看所有单位的数字化项目信息</li>
                                                <li>查看所有单位的数字化项目后评价和供应商评价信息</li>
                                            </ol>
                                        </li>
                                        <li>
                                            <strong>系统管理员</strong>
                                            <ol>
                                                <li>管理用户账号</li>
                                                <li>分配权限</li>
                                            </ol>
                                        </li>
                                    </ul>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'login-guide',
                title: '登录与导航',
                content: {
                    title: '登录与导航',
                    description: '了解如何登录平台并快速找到所需功能。',
                    sections: [
                        {
                            id: 'login',
                            title: '登录方式',
                            body: (
                                <div>
                                    <p>平台支持以下登录方式：</p>
                                    <ul>
                                        <li><strong>企业微信扫码登录</strong> — 推荐方式，打开企业微信扫描页面二维码即可自动登录</li>
                                        <li><strong>账号密码登录</strong> — 使用集团统一账号和密码登录</li>
                                        <li><strong>企业微信SSO登录</strong> — 通过企业微信单点登录，免密快速进入系统</li>
                                        <li><strong>企业微信工作台应用进入</strong> — 在企业微信工作台中点击应用图标，直接进入系统</li>
                                    </ul>
                                    <p>首次登录后，系统将根据您的角色自动分配对应权限，无需额外配置。</p>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                        <div style={{ flex: 1 }}>
                                            <img src={loginAccountImg} alt="账号密码登录" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>账号密码登录</p>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <img src={loginQrcodeImg} alt="企业微信扫码登录" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>企业微信扫码登录</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                        <div style={{ flex: 1 }}>
                                            <img src={loginWecomSsoImg} alt="企业微信SSO登录" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>企业微信SSO登录</p>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <img src={loginWecomWorkspaceImg} alt="企业微信工作台进入" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>企业微信工作台进入</p>
                                        </div>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            id: 'navigation',
                            title: '导航结构',
                            body: (
                                <div>
                                    <p>平台采用左侧菜单导航模式，菜单按业务模块分组：</p>
                                    <ul>
                                        <li>点击左侧菜单中的模块名称可展开或收起子菜单</li>
                                        <li>点击具体功能项进入对应页面</li>
                                        <li>当前所在页面在菜单中以高亮样式标识</li>
                                        <li>顶部面包屑显示当前页面的Tab标签，可点击快速跳转</li>
                                    </ul>
                                    <div style={{ marginTop: 16 }}>
                                        <img src={navigationStructureImg} alt="导航结构" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                        <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>平台导航结构</p>
                                    </div>
                                </div>
                            ),
                        },
                    ],
                },
            },
        ],
    },
    {
        id: 'plan-management',
        title: '计划管理',
        icon: <ScheduleOutlined style={{ color: ICON_COLOR }} />,
        children: [
            {
                id: 'plan-fill-guide',
                title: '投资计划填报',
                content: {
                    title: '投资计划填报',
                    description: '创建、编辑和提交投资计划。',
                    sections: [
                        {
                            id: 'create-plan',
                            title: '新建计划',
                            body: (
                                <div>
                                    <p>进入"投资计划填报"页面后，点击右上角"新建"按钮即可创建一条新的投资计划。</p>
                                    <p>操作步骤：</p>
                                    <ol>
                                        <li>点击"新建"按钮，系统自动生成计划编码</li>
                                        <li>填写基本信息：计划名称、项目类别、业务域、政策方向等</li>
                                        <li>填写资金信息：投资总额、分年度资金安排</li>
                                        <li>上传附件材料（如规划文件、可研报告等）</li>
                                        <li>点击"保存"保存为草稿，或点击"提交"直接提交审核</li>
                                    </ol>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>投资计划填报列表：</p>
                                            <img src={planFillListImg} alt="投资计划填报列表" style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>新增投资计划：</p>
                                            <img src={planFillNewImg} alt="新增投资计划" style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                                        </div>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            id: 'import-plan',
                            title: '模板导入',
                            body: (
                                <div>
                                    <p>对于批量录入场景，平台支持通过 Excel 模板批量导入投资计划：</p>
                                    <ol>
                                        <li>点击"模板下载"获取标准导入模板</li>
                                        <li>按模板格式填写计划数据</li>
                                        <li>点击"导入"选择填写好的 Excel 文件</li>
                                        <li>系统自动校验数据格式，校验通过后批量创建计划</li>
                                    </ol>
                                    <p>注意：导入时系统会自动校验必填字段和格式规则，不合规的数据行将被标记提示。</p>
                                </div>
                            ),
                        },
                        {
                            id: 'submit-plan',
                            title: '批量提交',
                            body: (
                                <div>
                                    <p>点击投资计划列表右上角"提交"按钮可一次性提交所有计划。</p>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'plan-review-guide',
                title: '投资计划审核',
                content: {
                    title: '投资计划审核',
                    description: '学习如何审核下级单位提交的投资计划。',
                    sections: [
                        {
                            id: 'review-flow',
                            title: '审核流程',
                            body: (
                                <div>
                                    <p>审核页面左侧为组织树，右侧为当前选中单位下的待审核计划列表。</p>
                                    <p>组织树节点颜色标识上报情况：</p>
                                    <ul>
                                        <li><strong>黑色</strong> — 未上报计划</li>
                                        <li><strong>蓝色</strong> — 有待审批的计划</li>
                                        <li><strong>红色</strong> — 计划被驳回</li>
                                        <li><strong>绿色</strong> — 计划已通过</li>
                                    </ul>
                                    <p>单位后方展示该单位下已上报的单位数/总单位数。</p>
                                    <p>审核操作流程：</p>
                                    <ol>
                                        <li>在左侧组织树中选择需要审核的单位节点</li>
                                        <li>右侧列表显示该单位下所有待审核的投资计划</li>
                                        <li>点击"详情"打开审核抽屉，查看计划详细信息</li>
                                        <li>点击"通过"审批通过，或点击"退回"填写退回原因后退回修改</li>
                                    </ol>
                                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                                        <img src={planReviewListImg} alt="投资计划审核列表" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }} />
                                        <p style={{ color: '#999', fontSize: 13, marginTop: 8 }}>投资计划审核列表页面</p>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            id: 'batch-review',
                            title: '批量审核',
                            body: (
                                <div>
                                    <p>支持对同一单位下的多条计划进行批量审核：</p>
                                    <ol>
                                        <li>系统自动选中当前筛选结果中的所有待审核计划</li>
                                        <li>点击列表右上角的"通过"按钮批量通过</li>
                                        <li>点击"退回"按钮，弹出退回原因填写弹窗，填写后确认批量退回</li>
                                    </ol>
                                    <p>注意：批量退回时，退回原因将统一应用到所有被退回的计划。</p>
                                </div>
                            ),
                        },
                        {
                            id: 'transit-plan',
                            title: '在途计划',
                            body: (
                                <div>
                                    <p>当筛选结果同时包含当前用户可审批的"待审核"计划和当前审批节点不在本用户的"在途"计划时，列表会自动切换为 Tab 页展示：</p>
                                    <ul>
                                        <li><strong>待审核</strong> — 当前用户可审批的计划，显示通过/退回按钮</li>
                                        <li><strong>在途</strong> — 审批节点不在当前用户的计划，仅可查看详情和发表评论</li>
                                    </ul>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'plan-view-guide',
                title: '投资计划查看',
                content: {
                    title: '投资计划查看',
                    description: '查看本单位已提交的投资计划详情与审核状态。',
                    sections: [
                        {
                            id: 'plan-view-overview',
                            title: '功能概述',
                            body: (
                                <div>
                                    <p>投资计划查看页面展示本单位已提交的投资计划列表，填报人员可查看计划详情和审核状态。</p>
                                    <ul>
                                        <li>计划填报人员可查看本单位的投资计划列表</li>
                                        <li>计划审核人员可查看本级及下级单位的计划列表</li>
                                        <li>支持按组织树选择公司，对应显示该公司下的投资计划</li>
                                    </ul>
                                </div>
                            ),
                        },
                        {
                            id: 'plan-view-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"计划管理 → 投资计划查看"页面</li>
                                        <li>选择组织树中的公司节点，右侧显示该公司对应的投资计划列表</li>
                                        <li>点击列表中"详情"操作，查看该条计划的详细信息</li>
                                        <li>点击"导出"按钮，可将当前查询结果列表导出为 Excel 等格式文件</li>
                                    </ol>
                                    <p>注意：详情中展示的信息需与计划填报、审批等环节数据关联，确保数据一致性。</p>
                                </div>
                            ),
                        },
                    ],
                },
            },
        ],
    },
    {
        id: 'budget-management',
        title: '预算管理',
        icon: <AccountBookOutlined style={{ color: ICON_COLOR }} />,
        children: [
            {
                id: 'budget-fill-guide',
                title: '预算填报',
                content: {
                    title: '预算填报',
                    description: '预算填报是实现项目成本管控的核心功能，贯穿项目全生命周期，通过预算编制、轮次上报、审核和数据统计，确保资金使用合规、透明且可控。',
                    sections: [
                        {
                            id: 'budget-fill-overview',
                            title: '功能概述',
                            body: (
                                <div>
                                    <p>预算填报是预算数据进入系统的核心入口，分为<b>本年预算内预算填报</b>与<b>本年预算外预算填报</b>两个标签页：</p>
                                    <ul>
                                        <li><strong>本年预算内预算填报</strong> — 预算内项目填报，按"一上 / 二上 / 三上"三个轮次逐级上报，支持模板导入与获取上轮数据</li>
                                        <li><strong>本年预算外预算填报</strong> — 预算外项目填报，不区分轮次，仅支持手动新增与导出</li>
                                    </ul>
                                    <p>填报年度默认展示<b>下一年度</b>（预算年度 = 当前年度 + 1），导入时按填报年度导入。</p>
                                </div>
                            ),
                        },
                        {
                            id: 'budget-fill-steps',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"预算管理 → 预算填报"页面，选择"本年预算内预算填报"或"本年预算外预算填报"标签</li>
                                        <li>预算内填报时，在卡片标题栏选择"一上 / 二上 / 三上"轮次；二上、三上轮次且上一轮已提交时，可点击"获取上轮数据"一键带入上轮填报内容</li>
                                        <li>点击"新增"按钮，在抽屉表单中填写预算信息并保存为草稿</li>
                                        <li>如需批量录入，预算内标签页可点击"模板下载"获取 CSV 模板，填写后通过"导入"上传</li>
                                        <li>草稿确认无误后，点击"提交"按钮，系统将对所有项目做统一的风控校验（如未关联投资计划、总额超投资计划金额等），确认后批量提交至审核流程</li>
                                    </ol>
                                    <p>注意：模板下载与导入功能仅"本年预算内预算填报"支持；预算外填报不提供批量导入。</p>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'budget-review-guide',
                title: '预算审核',
                content: {
                    title: '预算审核',
                    description: '预算审核人员通过组织树分单位查看并审核各单位填报的预算，支持单条与批量操作。',
                    sections: [
                        {
                            id: 'budget-review-overview',
                            title: '功能概述',
                            body: (
                                <div>
                                    <p>预算审核人员通过组织树方式，分单位查看待审核的预算列表，审核结果可选择"通过"或"退回"。</p>
                                    <p>组织树节点颜色标识上报情况：</p>
                                    <ul>
                                        <li><strong>黑色</strong> — 未上报预算</li>
                                        <li><strong>蓝色</strong> — 有待审批的预算</li>
                                        <li><strong>红色</strong> — 预算被驳回</li>
                                        <li><strong>绿色</strong> — 预算已通过</li>
                                    </ul>
                                    <p>节点标题后展示该单位<b>已提交单位数/总单位数</b>，并支持关键字过滤与"包含下级"勾选，便于快速掌握各单位上报进度。</p>
                                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                                        <img src={budgetReviewListImg} alt="预算审核列表" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }} />
                                        <p style={{ color: '#999', fontSize: 13, marginTop: 8 }}>预算审核列表页面</p>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            id: 'budget-review-flow',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"预算管理 → 预算审核"页面，选择"本年预算内预算审核"或"本年预算外预算审核"标签</li>
                                        <li>在左侧组织树中选择单位节点（支持关键字过滤与"包含下级"），右侧列表按"一上"、"二上"、"三上" 展示待审核预算</li>
                                        <li>点击"查看"或"审核"按钮打开审核抽屉，填写审核意见后点击"通过"或"退回"完成单条审核（退回时意见必填）</li>
                                        <li>勾选多条预算后点击上方"通过"或"退回"按钮执行批量审核，批量退回同样必须填写退回原因</li>
                                        <li>点击"导出"按钮，可将当前审核列表导出为 CSV 文件</li>
                                    </ol>
                                    <p>注意：列表项目名称前的风控预警图标表示该预算存在风控风险（如未关联投资计划、总额超投资计划等）。</p>

                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'budget-view-guide',
                title: '预算查看',
                content: {
                    title: '预算查看',
                    description: '查看本单位已提交的预算详情与审核状态。',
                    sections: [
                        {
                            id: 'budget-view-overview',
                            title: '功能概述',
                            body: (
                                <div>
                                    <p>预算查看页面顶部为查询区，支持按<b>项目名称</b>关键字与<b>年度</b>过滤；列表按"一上 / 二上 / 三上 / 预算外"四个标签分组展示，每个标签后标注对应的数据条数。</p>
                                    <p>列表包含"审核状态"列（Tag 标签），方便查看每条预算的审批进度与最终结果。</p>
                                </div>
                            ),
                        },
                        {
                            id: 'budget-view-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"预算管理 → 预算查看"页面，默认展示"一上"轮次的数据</li>
                                        <li>在查询区输入项目名称或选择年度后点击"查询"过滤列表，点击"重置"恢复默认条件</li>
                                        <li>切换"一上 / 二上 / 三上 / 预算外"标签页，查看对应轮次或预算外的预算列表</li>
                                        <li>点击列表中"详情"操作，查看该条预算的完整信息（基本信息、业务属性、时间与资金、流程信息）</li>
                                        <li>点击"导出"按钮，可将当前查询结果导出为 CSV 文件</li>
                                    </ol>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'budget-stat-guide',
                title: '预算统计',
                content: {
                    title: '预算统计',
                    description: '按组织树分单位查看预算统计数据，聚焦汇总口径。',
                    sections: [
                        {
                            id: 'budget-stat-overview',
                            title: '功能概述',
                            body: (
                                <div>
                                    <p>预算统计页面左侧为组织树（支持关键字过滤与"包含下级"勾选），右侧为查询区与统计列表，列表按"一上 / 二上 / 三上 / 预算外"四个标签页分组，每个标签带对应的数据条数。</p>
                                    <p>与预算查看页不同，统计列表聚焦数据汇总，不含"审核状态"列，便于按轮次查看预算总额与分布。</p>
                                </div>
                            ),
                        },
                        {
                            id: 'budget-stat-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"预算管理 → 预算统计"页面，在左侧组织树中选择单位节点（支持关键字过滤）</li>
                                        <li>在查询区输入项目名称或选择年度后点击"查询"，筛选统计范围</li>
                                        <li>切换"一上 / 二上 / 三上 / 预算外"标签页，查看对应轮次的统计列表</li>
                                        <li>点击列表中"详情"操作，查看该条预算的完整信息</li>
                                        <li>点击"导出"按钮，可将当前统计结果导出为 CSV 文件</li>
                                    </ol>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'budget-plan-fill-guide',
                title: '预算计划填报',
                content: {
                    title: '预算计划填报',
                    description: '预算填报人对年度预算执行计划数据进行填报。',
                    sections: [
                        {
                            id: 'budget-plan-fill-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"预算管理 → 预算计划填报"页面，展示预算计划填报列表</li>
                                        <li>选择对应预算，点击"查看"按钮，进入预算计划填报详情页面</li>
                                        <li>填写预算计划明细（项目计划/付款计划），填写的预计金额总额不能超过计划投资总额</li>
                                        <li>点击"保存"按钮暂存填报数据，或点击"提交"按钮提交</li>
                                    </ol>
                                    <p>注意：预算计划数据一经提交不可修改，填错的数据需集团/股份二级企业退回后进行修改。</p>
                                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                                        <img src={budgetPlanFillDetailImg} alt="预算计划填报详情" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }} />
                                        <p style={{ color: '#999', fontSize: 13, marginTop: 8 }}>月度执行计划填报表</p>
                                    </div>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'budget-plan-view-guide',
                title: '预算计划查看',
                content: {
                    title: '预算计划查看',
                    description: '预算审核人对年度预算执行计划数据进行查看。',
                    sections: [
                        {
                            id: 'budget-plan-view-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"预算管理 → 预算计划查看"页面，展示本单位及下级企业预算计划列表</li>
                                        <li>选择对应预算，点击"查看"按钮，进入预算计划查看详情页面</li>
                                        <li>如计划填报有误，上级单位预算审核人员可点击"退回"按钮，将该预算计划退回至预算填报人重新填报</li>
                                    </ol>
                                    <p>注意：上级单位预算审核人员完成提交锁定后无法再退回，除非再上一级单位执行"退回"操作。</p>
                                    <div style={{ marginTop: 16 }}>
                                        <img src={budgetPlanViewDetailImg} alt="预算计划查看详情" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                        <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>预算计划查看详情页面</p>
                                    </div>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'budget-execution-fill-guide',
                title: '预算执行填报',
                content: {
                    title: '预算执行填报',
                    description: '预算填报人员按实际发生额填报月度执行数据。',
                    sections: [
                        {
                            id: 'budget-execution-fill-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"预算管理 → 预算执行填报"页面，展示预算执行填报列表</li>
                                        <li>可直接在列表上编辑月度执行金额、项目执行阶段等信息，或点击"填报"按钮进入月度执行填报详情页面填写</li>
                                        <li>点击"保存"按钮暂存填报数据，或点击"提交"按钮提交</li>
                                    </ol>
                                    <p>注意：执行记录一经提交不可修改，填错的数据需集团/股份二级企业退回后进行修改。</p>
                                </div>
                            ),
                        },
                        {
                            id: 'budget-execution-fill-fields',
                            title: '填报字段说明',
                            body: (
                                <div>
                                    <p><strong>不可编辑字段</strong>（从已选预算项目自动带出）：项目名称、本年计划投资总额、项目简述、项目建设目标、项目类别等。</p>
                                    <p><strong>可编辑字段</strong>：项目合同金额、项目已付金额、项目进度状态、项目进度百分比、项目计划与实际偏差原因、项目阶段、实付金额等。</p>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                        <div style={{ flex: 1 }}>
                                            <img src={budgetExecutionFillListImg} alt="预算执行填报列表" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>预算执行填报列表页面</p>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <img src={budgetExecutionFillDetailImg} alt="预算执行填报详情" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>预算执行填报详情页面</p>
                                        </div>
                                    </div>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'budget-execution-stat-guide',
                title: '预算执行统计',
                content: {
                    title: '预算执行统计',
                    description: '查看各公司的预算执行填报状态和数据。',
                    sections: [
                        {
                            id: 'budget-execution-stat-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"预算管理 → 预算执行统计"页面，展示预算执行填报列表</li>
                                        <li>选择组织树中的公司，对应显示该公司的预算执行数据</li>
                                        <li>点击"查看"按钮，查询该条预算执行填报的详细信息</li>
                                        <li>点击"月度报告下载"或"年度报告下载"按钮，下载对应周期的执行报告</li>
                                    </ol>
                                    <div style={{ marginTop: 16 }}>
                                        <img src={budgetExecutionViewListImg} alt="预算执行统计" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                        <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>预算执行统计页面</p>
                                    </div>
                                </div>
                            ),
                        },
                    ],
                },
            },
        ],
    },
    {
        id: 'project-management',
        title: '项目管理',
        icon: <ProjectOutlined style={{ color: ICON_COLOR }} />,
        children: [
            {
                id: 'project-filing-guide',
                title: '项目备案',
                content: {
                    title: '项目备案',
                    description: '了解如何进行项目备案与基础信息归档。',
                    sections: [
                        {
                            id: 'filing-steps',
                            title: '备案操作',
                            body: (
                                <div>
                                    <p>项目备案流程：</p>
                                    <ol>
                                        <li>进入"项目备案"页面，点击"新增备案"，在弹出的预算项目窗口选择需要挂载的预算。</li>
                                        <li>填写项目基本信息（项目名称、所属单位、投资金额等）</li>
                                        <li>上传备案所需附件材料（含项目预期价值、架构看护文档等）</li>
                                        <li>提交备案申请，等待审核通过</li>
                                    </ol>
                                    <p>备案通过后，项目将进入"备案管理"台账，可进行后续的执行跟踪与变更管理。</p>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                        <div style={{ flex: 1 }}>
                                            <img src={projectFilingBudgetSelectImg} alt="预算项目选择" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>预算项目选择</p>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <img src={projectFilingDetailImg} alt="项目备案详情" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>项目备案详情页面</p>
                                        </div>
                                    </div>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'filing-management-guide',
                title: '备案管理',
                content: {
                    title: '备案管理',
                    description: '项目审核人员对提交的数字化立项备案表进行审核，配置项目执行节点。',
                    sections: [
                        {
                            id: 'filing-management-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"项目管理 → 备案管理"，查看项目审核列表</li>
                                    </ol>
                                    <div style={{ margin: '8px 0 16px 32px' }}>
                                        <img src={filingMgmtListImg} alt="备案管理列表" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                        <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>备案管理审核列表</p>
                                    </div>
                                    <ol start={2}>
                                        <li>点击"审核"查看立项备案表详细信息</li>
                                    </ol>
                                    <div style={{ margin: '8px 0 16px 32px' }}>
                                        <img src={filingMgmtDetailImg} alt="备案审核详情" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                        <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>立项备案表详细信息</p>
                                    </div>
                                    <ol start={3}>
                                        <li>配置项目执行需要的节点以及节点需要上传的材料，按需修改项目级别（普通项目、重点项目）</li>
                                    </ol>
                                    <div style={{ margin: '8px 0 16px 32px' }}>
                                        <img src={filingMgmtNodesImg} alt="节点配置" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                        <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>项目执行节点配置</p>
                                    </div>
                                    <ol start={4}>
                                        <li>如需专家或业务域审批，可从专家库选择专家和业务域人员，将流程转交提交意见</li>
                                    </ol>
                                    <div style={{ margin: '8px 0 16px 32px' }}>
                                        <img src={filingMgmtExpertImg} alt="选择评审人员" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                        <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>选择评审人员</p>
                                    </div>
                                    <ol start={5}>
                                        <li>点击"通过/退回"完成审核，退回时需填写审批意见</li>
                                    </ol>
                                </div>
                            ),
                        },
                        {
                            id: 'filing-management-rules',
                            title: '业务规则',
                            body: (
                                <div>
                                    <ul>
                                        <li>普通项目和重点项目默认配置对应的执行节点，节点可自定义配置</li>
                                        <li>若单位已做过专家评审，可在审批过程中上传附件</li>
                                        <li>下级单位备案审批流程结束后会直接流转到上级单位继续审批</li>
                                        <li>审批流程中前几级可提前查看流程并提供建议和意见</li>
                                    </ul>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'project-execution-guide',
                title: '项目执行',
                content: {
                    title: '项目执行',
                    description: '了解项目执行过程的跟踪与管理。',
                    sections: [
                        {
                            id: 'execution-tracking',
                            title: '执行跟踪',
                            body: (
                                <div>
                                    <p>项目执行页面以卡片+列表形式展示项目进度，主要功能包括：</p>
                                    <ul>
                                        <li><strong>基本信息</strong> — 项目概览、合同信息与附件管理</li>
                                        <li><strong>执行填报</strong> — 按节点填报项目执行进度与实际完成情况</li>
                                        <li><strong>操作记录</strong> — 记录项目关键里程碑与变更事件</li>
                                        <li><strong>进度监控</strong> — 通过状态图标实时监控项目是否滞后</li>
                                    </ul>
                                    <p>进度状态说明：绿色表示已完成，蓝色表示进行中，红色表示进度滞后。</p>
                                </div>
                            ),
                        },
                        {
                            id: 'execution-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <p>操作步骤：</p>
                                    <ol>
                                        <li>用户进入"项目管理→项目执行"，进入项目执行列表，列表上使用图标和数字高亮的形式展示项目进度，点击"编辑"按钮，进入节点信息填报页面；</li>
                                        <li>进入项目详情页，可查看项目的进程和所处的节点；</li>
                                        <li>填写节点信息，包括项目进度、累计付款信息以及上传节点材料；</li>
                                        <li>提交后更新项目执行状态；</li>
                                        <li>若下一个节点为审核节点，则需上级单位审核人审批。</li>
                                    </ol>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                        <div style={{ flex: 1 }}>
                                            <img src={projectExecutionListImg} alt="项目执行列表" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>项目执行列表页面</p>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <img src={projectExecutionDetailImg} alt="项目执行详情" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>项目执行详情页面</p>
                                        </div>
                                    </div>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'execution-management-guide',
                title: '执行管理',
                content: {
                    title: '执行管理',
                    description: '项目审核人员对项目执行节点填报的数据和上传的资料进行审核。',
                    sections: [
                        {
                            id: 'execution-management-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"项目管理 → 执行管理"，查看执行管理列表</li>
                                        <li>点击"审核"按钮，查看项目执行填报数据和上传材料</li>
                                        <li>审核执行信息，填写审批意见，点击"通过/退回"</li>
                                    </ol>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'project-change-guide',
                title: '项目变更',
                content: {
                    title: '项目变更',
                    description: '项目填报人员提出变更申请，说明变更内容、变更原因、影响及方案。',
                    sections: [
                        {
                            id: 'project-change-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"项目管理 → 项目变更"，选择需要变更的项目</li>
                                        <li>填写变更详情，包括变更类型（组织变更、投资变更、时间变更，可多选）</li>
                                        <li>填写变更内容、原因、对项目的影响及应对措施</li>
                                        <li>上传支撑材料</li>
                                        <li>提交变更申请</li>
                                    </ol>
                                    <p>注意：变更通过后会自动更新项目相关信息。</p>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                        <div style={{ flex: 1 }}>
                                            <img src={projectChangeListImg} alt="项目变更列表" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>项目变更列表页面</p>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <img src={projectChangeDetailImg} alt="项目变更详情" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>项目变更备案页面</p>
                                        </div>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            id: 'project-change-flow',
                            title: '审批流程',
                            body: (
                                <div>
                                    <ul>
                                        <li>发起人是项目审核人员的，变更申请自动推送到上级单位的项目审核人员</li>
                                        <li>发起人不是项目审核人员的，需流转到项目审核人员审批后再逐级推送</li>
                                    </ul>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'change-management-guide',
                title: '变更管理',
                content: {
                    title: '变更管理',
                    description: '项目审核人员审核提交的变更申请，查看各级单位提交的变更。',
                    sections: [
                        {
                            id: 'change-management-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"项目管理 → 变更管理"</li>
                                        <li>查看变更申请列表</li>
                                        <li>审核变更申请，填写审批意见，可点击"节点确认"进入节点确认窗口，如节点有变化可进行编辑，但已完成的节点不允许再编辑。确认好节点后点击"通过"完成变更。若该变更不满足审批条件，可在审核详情页点击"退回"。</li>
                                    </ol>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                        <div style={{ flex: 1 }}>
                                            <img src={changeMgmtListImg} alt="变更管理列表" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>变更管理列表页面</p>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <img src={changeMgmtDetailImg} alt="变更管理审核" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                            <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>变更审核详情页面</p>
                                        </div>
                                    </div>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'project-post-eval-guide',
                title: '项目后评价',
                content: {
                    title: '项目后评价',
                    description: '项目完成后对目标完成情况、实施过程、成果效益等进行综合评价。',
                    sections: [
                        {
                            id: 'post-eval-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"项目管理 → 项目后评价"，选择已完成项目</li>
                                        <li>填写实际完成情况描述</li>
                                        <li>按指标体系评分（评价指标支持自定义配置）</li>
                                        <li>提交后生成后评价报告</li>
                                    </ol>
                                    <div style={{ marginTop: 16 }}>
                                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>详情页面：</p>
                                        <img src={postEvalDetailImg} alt="项目后评价详情页面" style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                                    </div>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'supplier-eval-guide',
                title: '供应商评价',
                content: {
                    title: '供应商评价',
                    description: '对项目合作的供应商进行综合评价，支持量化评分。',
                    sections: [
                        {
                            id: 'supplier-eval-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"项目管理 → 供应商评价"</li>
                                        <li>选择合作供应商和项目</li>
                                        <li>按指标评分（系统自动计算总分）</li>
                                        <li>填写评价意见和建议</li>
                                        <li>提交评价</li>
                                    </ol>
                                    <div style={{ marginTop: 16 }}>
                                        <img src={supplierEvalDetailImg} alt="供应商评价" style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
                                        <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 8 }}>供应商评价页面</p>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            id: 'supplier-eval-rules',
                            title: '业务规则',
                            body: (
                                <div>
                                    <ul>
                                        <li>同一供应商的评价自动汇总，生成历史评分趋势</li>
                                        <li>信用等级低于阈值的供应商自动进入黑名单预警</li>
                                    </ul>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'post-eval-management-guide',
                title: '后评价管理',
                content: {
                    title: '后评价管理',
                    description: '对项目后评价结果进行查看和管理。',
                    sections: [
                        {
                            id: 'post-eval-mgmt-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"项目管理 → 后评价管理"</li>
                                        <li>查看后评价列表，支持按评价得分排序</li>
                                        <li>可查看后评价详细信息</li>
                                    </ol>
                                    <div style={{ marginTop: 16 }}>
                                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>后评价管理列表页面：</p>
                                        <img src={postEvalMgmtListImg} alt="后评价管理列表页面" style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                                    </div>
                                </div>
                            ),
                        },
                    ],
                },
            },
        ],
    },
    {
        id: 'resource-guide',
        title: '资源库',
        icon: <DatabaseOutlined style={{ color: ICON_COLOR }} />,
        children: [
            {
                id: 'expert-database-guide',
                title: '专家库',
                content: {
                    title: '专家库',
                    description: '了解专家信息维护与查询管理。',
                    sections: [
                        {
                            id: 'expert-manage',
                            title: '专家管理',
                            body: (
                                <div>
                                    <p>专家库为平台提供专业人才资源支持：</p>
                                    <ul>
                                        <li><strong>信息维护</strong> — 录入和更新专家的基本信息、专业领域与资质</li>
                                        <li><strong>分类查询</strong> — 按专业领域、所属单位等条件筛选专家</li>
                                        <li><strong>专家评审</strong> — 在项目评审环节选择合适的专家参与评审</li>
                                    </ul>
                                </div>
                            ),
                        },
                        {
                            id: 'expert-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <p>操作步骤：</p>
                                    <ol>
                                        <li>用户进入"资源库→专家库"；</li>
                                        <li>点击"添加专家"，选择用户，并维护其他信息；</li>
                                        <li>提交后用户进入专家库；</li>
                                        <li>用户可通过检索或分类浏览查找专家，用户可查看本级以及下级的专家库。</li>
                                    </ol>
                                    <div style={{ marginTop: 16 }}>
                                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>专家库列表页面：</p>
                                        <img src={expertDatabaseListImg} alt="专家库列表页面" style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                                    </div>
                                </div>
                            ),
                        },
                    ],
                },
            },
            {
                id: 'resource-sharing-guide',
                title: '资源共享',
                content: {
                    title: '资源共享',
                    description: '支持上传、下载和管理项目相关资源，促进知识共享。',
                    sections: [
                        {
                            id: 'resource-sharing-ops',
                            title: '操作步骤',
                            body: (
                                <div>
                                    <ol>
                                        <li>进入"资源库 → 资源共享"</li>
                                        <li>点击"上传资源"，填写资源信息并选择文件</li>
                                        <li>提交后资源进入资源库</li>
                                        <li>其他用户可通过检索或分类浏览查找资源，有权限的可下载</li>
                                    </ol>
                                </div>
                            ),
                        },
                        {
                            id: 'resource-sharing-types',
                            title: '资源类型',
                            body: (
                                <div>
                                    <p>资源库支持以下类型的文件管理：</p>
                                    <ul>
                                        <li><strong>模板文件</strong> — 各类业务填报模板</li>
                                        <li><strong>技术文档</strong> — 技术规范、设计方案等</li>
                                        <li><strong>培训材料</strong> — 操作手册、培训课件等</li>
                                        <li><strong>制度文件</strong> — 管理制度、审批规范等</li>
                                    </ul>
                                    <p>系统对资源进行分类管理，方便检索和查找。</p>
                                    <div style={{ marginTop: 16 }}>
                                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>资源共享列表页面：</p>
                                        <img src={resourceSharingListImg} alt="资源共享列表页面" style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                                    </div>
                                </div>
                            ),
                        },
                    ],
                },
            },
        ],
    },
    {
        id: 'faq',
        title: '常见问题',
        icon: <QuestionCircleOutlined style={{ color: ICON_COLOR }} />,
        children: [
            {
                id: 'common-issues',
                title: '常见问题解答',
                content: {
                    title: '常见问题解答',
                    description: '汇总使用中经常遇到的问题与解决方案。',
                    sections: [
                        {
                            id: 'q-permission',
                            title: '权限与访问',
                            body: (
                                <div>
                                    <p><strong>Q: 为什么我看不到某些菜单？</strong></p>
                                    <p>A: 菜单显示基于用户角色权限配置，请联系系统管理员为您分配对应角色权限。</p>
                                    <p><strong>Q: 组织树中没有我的单位怎么办？</strong></p>
                                    <p>A: 组织架构由系统管理员统一维护，如需新增或调整请联系管理员。</p>
                                </div>
                            ),
                        },
                        {
                            id: 'q-data',
                            title: '数据与操作',
                            body: (
                                <div>
                                    <p><strong>Q: 提交后的计划还能修改吗？</strong></p>
                                    <p>A: 已提交的计划需等待审核。如果被退回，可修改后重新提交。</p>
                                    <p><strong>Q: 导入模板报错如何处理？</strong></p>
                                    <p>A: 请检查模板格式是否符合要求，必填字段是否完整，数据类型是否匹配。导入页面会显示详细的校验错误信息。</p>
                                    <p><strong>Q: 预算计划填报提交后发现错误怎么办？</strong></p>
                                    <p>A: 预算计划数据一经提交不可修改，需联系上级审核人员退回后才能修改。</p>
                                    <p><strong>Q: 预算填报时无法新建是什么原因？</strong></p>
                                    <p>A: 如有未完成的预算项目，系统不允许直接新建，需先从历史预算中导入。</p>
                                </div>
                            ),
                        },
                    ],
                },
            },
        ],
    },
];

/* ============ 搜索过滤工具 ============ */

function flattenSections(sections: DocSection[]): DocSection[] {
    const result: DocSection[] = [];
    for (const s of sections) {
        if (s.children) {
            result.push(...flattenSections(s.children));
        } else {
            result.push(s);
        }
    }
    return result;
}

/* ============ 页面组件 ============ */

export default function OperationManualPage() {
    const [activeDocId, setActiveDocId] = useState('platform-intro');
    const [searchText, setSearchText] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['getting-started', 'plan-management', 'faq']);
    const contentRef = useRef<HTMLDivElement>(null);

    // 找到当前激活的文档
    const activeDoc = useMemo(() => {
        const all = flattenSections(docSections);
        return all.find((s) => s.id === activeDocId) || all[0];
    }, [activeDocId]);

    // 当前文档内容
    const docContent = activeDoc?.content;

    // 搜索过滤
    const filteredSections = useMemo(() => {
        if (!searchText.trim()) return docSections;
        const kw = searchText.trim().toLowerCase();
        return docSections
            .map((group) => {
                const matchChildren = (group.children || []).filter((child) => {
                    if (child.title.toLowerCase().includes(kw)) return true;
                    if (child.content?.sections?.some((s) => s.title.toLowerCase().includes(kw))) return true;
                    return false;
                });
                if (matchChildren.length > 0) {
                    return { ...group, children: matchChildren };
                }
                return null;
            })
            .filter(Boolean) as DocSection[];
    }, [searchText]);

    // 目录切换时滚动到顶部
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [activeDocId]);

    const toggleGroup = useCallback((id: string) => {
        setExpandedGroups((prev) =>
            prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
        );
    }, []);

    // 右侧"本页导航"锚点
    const pageAnchors = docContent?.sections || [];

    const [activeAnchor, setActiveAnchor] = useState<string>('');

    // 监听内容区滚动高亮锚点
    useEffect(() => {
        const container = contentRef.current;
        if (!container || !docContent) return;
        const onScroll = () => {
            const headings = docContent.sections.map((s) => document.getElementById(`doc-anchor-${s.id}`)).filter(Boolean) as HTMLElement[];
            let current = docContent.sections[0]?.id || '';
            for (const h of headings) {
                if (h.offsetTop - container.offsetTop - 120 <= container.scrollTop) {
                    current = h.id.replace('doc-anchor-', '');
                }
            }
            setActiveAnchor(current);
        };
        container.addEventListener('scroll', onScroll, { passive: true });
        return () => container.removeEventListener('scroll', onScroll);
    }, [docContent]);

    return (
        <div className="dmp-page-stack" style={{ height: '100%', overflow: 'hidden' }}>
            <div style={{ display: 'flex', height: '100%', background: '#fff' }}>
                {/* ====== 左侧目录 ====== */}
                <div
                    style={{
                        width: 260,
                        flexShrink: 0,
                        borderRight: '1px solid #f0f0f0',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        overflow: 'hidden',
                    }}
                >
                    {/* 搜索栏 */}
                    <div style={{ padding: '16px 16px 8px' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                border: '1px solid #e5e7eb',
                                borderRadius: 6,
                                padding: '6px 12px',
                                background: '#f9fafb',
                            }}
                        >
                            <SearchOutlined style={{ color: '#9ca3af', fontSize: 13 }} />
                            <input
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="搜索文档..."
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    fontSize: 13,
                                    width: '100%',
                                    color: '#374151',
                                }}
                            />
                        </div>
                    </div>

                    {/* 目录列表 */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 16px' }}>
                        {filteredSections.map((group) => {
                            const isExpanded = expandedGroups.includes(group.id);
                            return (
                                <div key={group.id}>
                                    <div
                                        onClick={() => toggleGroup(group.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '8px 16px',
                                            cursor: 'pointer',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: '#374151',
                                            userSelect: 'none',
                                        }}
                                    >
                                        {isExpanded ? (
                                            <CaretDownOutlined style={{ fontSize: 10, color: '#9ca3af' }} />
                                        ) : (
                                            <CaretRightOutlined style={{ fontSize: 10, color: '#9ca3af' }} />
                                        )}
                                        <span style={{ flex: 1 }}>{group.title}</span>
                                    </div>
                                    {isExpanded &&
                                        (group.children || []).map((child) => {
                                            const isActive = child.id === activeDocId;
                                            return (
                                                <div
                                                    key={child.id}
                                                    onClick={() => child.content && setActiveDocId(child.id)}
                                                    style={{
                                                        padding: '6px 16px 6px 38px',
                                                        fontSize: 13,
                                                        color: isActive ? '#6366f1' : '#6b7280',
                                                        background: isActive ? '#f0f0ff' : 'transparent',
                                                        cursor: child.content ? 'pointer' : 'default',
                                                        borderLeft: isActive ? '2px solid #6366f1' : '2px solid transparent',
                                                        transition: 'all 0.15s',
                                                        lineHeight: '22px',
                                                    }}
                                                >
                                                    {child.title}
                                                </div>
                                            );
                                        })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ====== 中间内容区 ====== */}
                <div
                    ref={contentRef}
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '0 48px 48px 48px',
                        minWidth: 0,
                    }}
                >
                    {docContent ? (
                        <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: 40 }}>
                            {/* 面包屑 */}
                            <div style={{ fontSize: 12, color: '#6366f1', marginBottom: 12, fontWeight: 500 }}>
                                {(() => {
                                    // 找到所属分组
                                    for (const group of docSections) {
                                        if (group.children?.some((c) => c.id === activeDocId)) {
                                            return group.title;
                                        }
                                    }
                                    return '';
                                })()}
                            </div>

                            {/* 标题 */}
                            <h1 style={{ fontSize: 30, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.3 }}>
                                {docContent.title}
                            </h1>
                            <p style={{ fontSize: 16, color: '#6b7280', marginTop: 8, lineHeight: 1.6 }}>
                                {docContent.description}
                            </p>

                            <div style={{ borderBottom: '1px solid #f0f0f0', margin: '24px 0' }} />

                            {/* 正文段落 */}
                            {docContent.sections.map((section) => (
                                <div key={section.id} style={{ marginTop: 32 }}>
                                    <h2
                                        id={`doc-anchor-${section.id}`}
                                        style={{
                                            fontSize: 22,
                                            fontWeight: 600,
                                            color: '#111827',
                                            marginBottom: 12,
                                            scrollMarginTop: 80,
                                        }}
                                    >
                                        {section.title}
                                    </h2>
                                    <div
                                        style={{
                                            fontSize: 15,
                                            color: '#374151',
                                            lineHeight: 1.75,
                                        }}
                                    >
                                        {section.body}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af' }}>
                            请从左侧目录选择文档
                        </div>
                    )}
                </div>

                {/* ====== 右侧本页导航 ====== */}
                {pageAnchors.length > 0 && (
                    <div
                        style={{
                            width: 180,
                            flexShrink: 0,
                            borderLeft: '1px solid #f0f0f0',
                            padding: '48px 16px 16px',
                            overflowY: 'auto',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 12,
                                color: '#9ca3af',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                marginBottom: 12,
                            }}
                        >
                            On this page
                        </div>
                        {pageAnchors.map((anchor) => {
                            const isActive = activeAnchor === anchor.id;
                            return (
                                <div
                                    key={anchor.id}
                                    onClick={() => {
                                        const el = document.getElementById(`doc-anchor-${anchor.id}`);
                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }}
                                    style={{
                                        padding: '4px 0 4px 12px',
                                        fontSize: 12,
                                        color: isActive ? '#6366f1' : '#6b7280',
                                        borderLeft: isActive ? '2px solid #6366f1' : '2px solid transparent',
                                        cursor: 'pointer',
                                        marginBottom: 4,
                                        transition: 'all 0.15s',
                                        lineHeight: '20px',
                                    }}
                                >
                                    {anchor.title}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 全局样式：正文排版 */}
            <style>{`
                .dmp-page-stack ul, .dmp-page-stack ol {
                    padding-left: 20px;
                    margin: 8px 0;
                }
                .dmp-page-stack li {
                    margin-bottom: 6px;
                    line-height: 1.7;
                }
                .dmp-page-stack p {
                    margin-bottom: 12px;
                }
                .dmp-page-stack strong {
                    color: #111827;
                }
            `}</style>
        </div>
    );
}
