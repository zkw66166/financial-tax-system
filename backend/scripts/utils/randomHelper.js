/**
 * 随机数生成辅助工具
 */

class RandomHelper {
    /**
     * 生成指定范围内的随机数
     */
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * 生成带波动的数值
     * @param {number} base - 基准值
     * @param {number} volatility - 波动率 (0-1)
     */
    static withVolatility(base, volatility = 0.05) {
        const factor = 1 + this.random(-volatility, volatility);
        return base * factor;
    }

    /**
     * 生成整数
     */
    static randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    }

    /**
     * 从数组中随机选择
     */
    static choice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * 生成随机日期字符串
     */
    static randomDate(year, month, day = null) {
        if (day === null) {
            day = this.randomInt(1, 28); // 保守使用28天
        }
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
}

module.exports = RandomHelper;
