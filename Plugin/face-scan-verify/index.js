const plugin = {
  name: 'face-scan-verify',
  is_face_scan: true,
  inputSchema: {
    name: '姓名',
    id_number: '身份证号码',
  },

  async handle(params, config) {
    const { name, id_number } = params;

    if (!name || !id_number) {
      return {
        message: '缺少必要参数: name, id_number',
        success: false,
      };
    }

    if (id_number.length !== 18) {
      return {
        message: '身份证号码格式不正确',
        success: false,
      };
    }

    // 从身份证号提取出生年月 (第7-14位)
    const birthYear = parseInt(id_number.substring(6, 10));
    const birthMonth = parseInt(id_number.substring(10, 12));
    const birthDay = parseInt(id_number.substring(12, 14));
    const birthDate = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

    // 计算是否成年 (>= 18岁)
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const monthDiff = today.getMonth() + 1 - birthMonth;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
      age--;
    }
    const isAdult = age >= 18;

    const qrData = `face-scan://${Buffer.from(JSON.stringify({ name, id_number, timestamp: Date.now(), birthDate, isAdult })).toString('base64')}`;

    return {
      message: '请扫描二维码进行人脸识别',
      'qr-data': qrData,
      success: true,
      isAdult,
      birthDate,
    };
  },
};

export default plugin;
