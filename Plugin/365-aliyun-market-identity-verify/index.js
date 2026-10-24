/**
 * 阿里云身份证实名认证插件
 *
 * 接口文档：https://market.aliyun.com/detail/cmapi00037894
 * 请求方式：POST https://zidv2.market.alicloudapi.com/idcheck/Post
 * 请求头：  Authorization:APPCODE <AppCode>
 * 请求体：  cardNo=<身份证号>&realName=<姓名>（application/x-www-form-urlencoded）
 *
 * 管理员需在后台配置 AppCode 后方可启用本插件。
 */

const API_URL = 'https://zidv2.market.alicloudapi.com/idcheck/Post';

const plugin = {
  name: '365-aliyun-market-identity-verify',
  is_face_scan: false,

  pluginDescription:
    '由阿里云市场商家北京互联三六五科技有限公司提供实名认证服务（二要素身份证核验）。' +
    '需要在阿里云市场购买该 API 并获取 AppCode，' +
    '详见：<a href="https://market.aliyun.com/detail/cmapi00037894" target="_blank">阿里云身份证实名认证</a>',

  inputSchema: {
    name: '姓名',
    id_number: '身份证号码',
  },

  /** 声明管理员需要在后台填写的配置项 */
  configSchema: [
    {
      key: 'appCode',
      label: '阿里云 AppCode',
      type: 'password',
      placeholder: '请输入阿里云市场 AppCode',
      required: true,
      description:
        '在阿里云市场购买该 API 后获得的 AppCode，格式如：xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
  ],

  async handle(params, config) {
    const { name, id_number } = params;
    const appCode = config?.appCode?.trim();

    if (!name || !id_number) {
      return { message: '缺少必要参数：name、id_number', success: false };
    }

    if (id_number.length !== 18) {
      return { message: '身份证号码格式不正确（应为 18 位）', success: false };
    }

    if (!appCode) {
      return {
        message: '插件未配置阿里云 AppCode，请联系管理员在后台配置',
        success: false,
      };
    }

    try {
      const body = new URLSearchParams({
        cardNo: id_number,
        realName: name,
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `APPCODE ${appCode}`,
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          message: `阿里云接口请求失败（HTTP ${response.status}）：${errorText}`,
          success: false,
        };
      }

      const data = await response.json();

      // 阿里云 API 响应结构：
      // { "code": 0, "message": "success", "data": { "res": 1, "description": "一致", "birthDate": "19900101", ... } }
      // res: 1=一致, 2=不一致
      if (data.code !== 0 && data.code !== '0') {
        return {
          message: `认证接口返回错误：${data.message || JSON.stringify(data)}`,
          success: false,
        };
      }

      const resData = data.data || {};

      if (resData.res === 1 || resData.res === '1') {
        // 身份核验一致，提取出生日期计算成年状态
        let birthDate = null;
        let isAdult = false;

        // 优先使用接口返回的出生日期（格式 YYYYMMDD 或 YYYY-MM-DD）
        if (resData.birthDate || resData.birthday) {
          const raw = (resData.birthDate || resData.birthday || '').replace(
            /-/g,
            '',
          );
          if (raw.length === 8) {
            const year = raw.substring(0, 4);
            const month = raw.substring(4, 6);
            const day = raw.substring(6, 8);
            birthDate = `${year}-${month}-${day}`;
            const age = calculateAge(birthDate);
            isAdult = age >= 18;
          }
        }

        // 若接口未返回出生日期，从身份证号提取
        if (!birthDate) {
          const year = id_number.substring(6, 10);
          const month = id_number.substring(10, 12);
          const day = id_number.substring(12, 14);
          birthDate = `${year}-${month}-${day}`;
          const age = calculateAge(birthDate);
          isAdult = age >= 18;
        }

        return {
          message: '实名认证通过',
          success: true,
          isAdult,
          birthDate,
        };
      } else {
        return {
          message:
            resData.description || '身份信息核验不一致，请检查姓名和身份证号码',
          success: false,
        };
      }
    } catch (err) {
      return {
        message: `认证请求异常：${err.message || err}`,
        success: false,
      };
    }
  },
};

/**
 * 根据出生日期字符串（YYYY-MM-DD）计算周岁
 */
function calculateAge(birthDate) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age--;
  }
  return age;
}

export default plugin;
