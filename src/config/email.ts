import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

dotenv.config();

// SendGrid API 키 설정
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// 이메일 전송을 위한 SMTP 설정
export const createTransporter = () => {
  // 환경 설정에 따라 다양한 이메일 서비스 사용 가능
  // Gmail, SendGrid, AWS SES, Mailgun 등
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASSWORD || '',
    },
  });
};

// 이메일 발송 함수
export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    // SendGrid API를 사용하는 경우
    if (process.env.USE_SENDGRID === 'true' && process.env.SENDGRID_API_KEY) {
      const msg = {
        to,
        from: process.env.EMAIL_FROM || 'newsletter@aitrendblog.co.kr',
        subject,
        html,
      };
      
      await sgMail.send(msg);
      console.log(`SendGrid로 이메일이 성공적으로 발송되었습니다: ${to}`);
      return { messageId: 'sendgrid_success' };
    } 
    // 기존 Nodemailer 사용
    else {
      const transporter = createTransporter();
      
      const info = await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'AI 트렌드 파인더'}" <${process.env.EMAIL_FROM || 'newsletter@aitrendblog.co.kr'}>`,
        to,
        subject,
        html,
      });
      
      console.log(`이메일이 성공적으로 발송되었습니다: ${info.messageId}`);
      return info;
    }
  } catch (error) {
    console.error('이메일 발송 실패:', error);
    throw error;
  }
};

// 이메일 템플릿
export const emailTemplates = {
  // 구독 확인 이메일
  verification: (name: string, verificationUrl: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>AI 트렌드 파인더 구독 확인</h2>
      <p>안녕하세요 ${name || '구독자'}님,</p>
      <p>AI 트렌드 파인더 블로그 구독을 신청해 주셔서 감사합니다. 아래 버튼을 클릭하여 구독을 확인해 주세요.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">구독 확인하기</a>
      </div>
      <p>버튼이 작동하지 않는 경우, 아래 링크를 브라우저에 복사하여 붙여넣어 주세요:</p>
      <p>${verificationUrl}</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #777; font-size: 12px;">이 이메일은 구독 요청에 의해 발송되었습니다. 본인이 요청하지 않았다면 이 이메일을 무시하시면 됩니다.</p>
    </div>
  `,
  
  // 블로그 업데이트 알림 이메일
  blogUpdate: (name: string, posts: Array<{title: string, url: string, excerpt?: string}>, unsubscribeUrl: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>AI 트렌드 파인더 최신 업데이트</h2>
      <p>안녕하세요 ${name || '구독자'}님,</p>
      <p>AI 트렌드 파인더 블로그에 새로운 소식이 있습니다:</p>
      
      <div style="margin: 20px 0;">
        ${posts.map(post => `
          <div style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0;"><a href="${post.url}" style="color: #3498db; text-decoration: none;">${post.title}</a></h3>
            ${post.excerpt ? `<p style="margin: 0; color: #555;">${post.excerpt}</p>` : ''}
            <p><a href="${post.url}" style="color: #3498db; font-size: 14px;">자세히 보기 →</a></p>
          </div>
        `).join('')}
      </div>
      
      <p style="margin-top: 30px;">더 많은 AI 트렌드와 업데이트는 <a href="${process.env.WEBSITE_URL || 'https://example.com'}" style="color: #3498db;">웹사이트</a>에서 확인하세요.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #777; font-size: 12px;">
        이 이메일은 AI 트렌드 파인더 구독자에게 발송됩니다.
        더 이상 이메일을 받고 싶지 않으시면 <a href="${unsubscribeUrl}" style="color: #777;">구독 취소</a>를 클릭하세요.
      </p>
    </div>
  `,
  
  // 가입 완료 메일
  welcome: (name: string, loginUrl: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>AI 트렌드 파인더 구독이 완료되었습니다!</h2>
      <p>안녕하세요 ${name || '구독자'}님,</p>
      <p>AI 트렌드 파인더 블로그 구독이 성공적으로 완료되었습니다. 앞으로 최신 AI 트렌드와 유용한 정보를 정기적으로 받아보실 수 있습니다.</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;">✅ 구독 상태: <strong>활성화됨</strong></p>
        <p style="margin: 10px 0 0;">📧 구독 이메일: <strong>${process.env.EMAIL_FROM || 'newsletter@aitrendblog.co.kr'}</strong></p>
      </div>
      <p>블로그에 방문하여 최신 콘텐츠를 확인해 보세요:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">블로그 방문하기</a>
      </div>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #777; font-size: 12px;">
        이 이메일은 AI 트렌드 파인더 구독자에게 발송됩니다.
        구독 관련 문의사항이 있으시면 이 이메일에 회신해 주세요.
      </p>
    </div>
  `
}; 