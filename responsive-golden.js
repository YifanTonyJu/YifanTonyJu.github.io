/**
 * Golden Ratio Responsive Design System
 * 基于黄金比例的响应式设计
 * φ (phi) = 1.618033988749895
 * 1/φ = 0.618033988749895
 */

const GOLDEN_RATIO = 1.618033988749895;
const INVERSE_GOLDEN = 0.618033988749895;

/**
 * 计算响应式单位
 * 基于视口宽度和黄金比例
 */
function calculateResponsiveUnits() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 基础单位：视口宽度的1/20作为基准
    // 这样在 375px 手机上是 ~18.75px
    // 在 1200px 桌面上是 60px
    const baseUnit = viewportWidth / 20;
    
    // 计算页面高度占比系数
    // 用于确定顶部间距
    const heightCoefficient = viewportHeight / 667; // 以 iPhone 8 高度为基准
    
    // 使用黄金比例生成间距阶梯
    // 每一级都是上一级的 φ 倍
    const spacingUnits = {
        xs: baseUnit * 0.5,           // 最小间距
        sm: baseUnit * 0.618,          // 次小间距（用 1/φ）
        md: baseUnit,                   // 基础间距
        lg: baseUnit * GOLDEN_RATIO,   // 中等间距
        xl: baseUnit * Math.pow(GOLDEN_RATIO, 2),     // 大间距
        xxl: baseUnit * Math.pow(GOLDEN_RATIO, 3),    // 超大间距
    };
    
    // 字体大小也用黄金比例
    // 基础字体大小根据视口宽度调整
    const baseFontSize = Math.max(14, Math.min(18, viewportWidth / 40));
    
    const fontSizes = {
        xs: baseFontSize * 0.75,
        sm: baseFontSize * 0.875,
        base: baseFontSize,
        lg: baseFontSize * GOLDEN_RATIO,
        xl: baseFontSize * Math.pow(GOLDEN_RATIO, 2),
        '2xl': baseFontSize * Math.pow(GOLDEN_RATIO, 3),
        '3xl': baseFontSize * Math.pow(GOLDEN_RATIO, 4),
    };
    
    // 顶部间距（导航栏到标题的距离）
    // 使用黄金比例，在不同设备上都显得适中
    const sectionTopPadding = baseUnit * Math.pow(GOLDEN_RATIO, 2.5) * heightCoefficient;
    
    return {
        baseUnit,
        heightCoefficient,
        spacing: spacingUnits,
        fontSize: fontSizes,
        sectionTopPadding,
        viewportWidth,
        viewportHeight,
    };
}

/**
 * 应用响应式样式到页面
 */
function applyResponsiveStyles() {
    const units = calculateResponsiveUnits();
    const root = document.documentElement;
    
    // 设置 CSS 变量
    root.style.setProperty('--base-unit', `${units.baseUnit}px`);
    root.style.setProperty('--spacing-xs', `${units.spacing.xs}px`);
    root.style.setProperty('--spacing-sm', `${units.spacing.sm}px`);
    root.style.setProperty('--spacing-md', `${units.spacing.md}px`);
    root.style.setProperty('--spacing-lg', `${units.spacing.lg}px`);
    root.style.setProperty('--spacing-xl', `${units.spacing.xl}px`);
    root.style.setProperty('--spacing-2xl', `${units.spacing.xxl}px`);
    root.style.setProperty('--spacing-3xl', `${units.spacing.xxl * GOLDEN_RATIO}px`);
    
    root.style.setProperty('--font-size-xs', `${units.fontSize.xs}px`);
    root.style.setProperty('--font-size-sm', `${units.fontSize.sm}px`);
    root.style.setProperty('--font-size-base', `${units.fontSize.base}px`);
    root.style.setProperty('--font-size-lg', `${units.fontSize.lg}px`);
    root.style.setProperty('--font-size-xl', `${units.fontSize.xl}px`);
    root.style.setProperty('--font-size-2xl', `${units.fontSize['2xl']}px`);
    root.style.setProperty('--font-size-3xl', `${units.fontSize['3xl']}px`);
    
    root.style.setProperty('--section-top-padding', `${units.sectionTopPadding}px`);
    
    // 调试信息（可选）
    console.log('📐 Responsive Units Updated:', {
        viewport: `${units.viewportWidth}x${units.viewportHeight}`,
        baseUnit: `${units.baseUnit.toFixed(2)}px`,
        sectionTopPadding: `${units.sectionTopPadding.toFixed(2)}px`,
    });
}

/**
 * 初始化：在页面加载和窗口尺寸变化时应用
 */
function initResponsiveDesign() {
    // 立即应用
    applyResponsiveStyles();
    
    // 窗口大小改变时重新计算
    window.addEventListener('resize', () => {
        applyResponsiveStyles();
    });
    
    // 设备方向改变时也重新计算
    window.addEventListener('orientationchange', () => {
        setTimeout(applyResponsiveStyles, 100);
    });
}

// 当 DOM 准备好时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResponsiveDesign);
} else {
    initResponsiveDesign();
}

// 暴露全局函数供其他脚本使用
window.updateResponsiveUnits = applyResponsiveStyles;
window.getResponsiveUnits = calculateResponsiveUnits;
