import { Request, Response } from 'express';
import supabase from '../config/supabase';
import { sendEmail, emailTemplates } from '../config/email';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// 기본 웹사이트 URL
const BASE_URL = process.env.WEBSITE_URL || 'https://www.aitrendblog.co.kr';

// 구독 신청 처리
export const subscribe = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: '이메일 주소가 필요합니다.' });
    }

    // 이메일 형식 검증
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 이메일 주소입니다.' });
    }

    // 이미 구독 중인지 확인
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('subscribers')
      .select('id, status, verification_token')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116는 결과가 없음을 의미
      console.error('구독자 확인 오류:', checkError);
      return res.status(500).json({ success: false, message: '구독자 정보 확인 중 오류가 발생했습니다.' });
    }

    // 재구독 처리
    if (existingSubscriber) {
      if (existingSubscriber.status === 'active') {
        return res.status(200).json({ 
          success: true, 
          message: '이미 구독 중입니다.',
          subscribed: true
        });
      }

      if (existingSubscriber.status === 'pending') {
        // 재전송 로직 - 이메일 전송 활성화
        const verificationUrl = `${BASE_URL}/verify-subscription/${existingSubscriber.verification_token}`;
        
        try {
          console.log('이메일 전송 시도:', {
            to: email,
            subject: 'AI 트렌드 파인더 구독 확인',
            verificationUrl
          });
          
          // 이메일 전송 활성화
          await sendEmail(
            email,
            'AI 트렌드 파인더 구독 확인',
            emailTemplates.verification(name || '', verificationUrl)
          );
        } catch (emailError) {
          console.error('확인 이메일 발송 실패:', emailError);
        }

        return res.status(200).json({ 
          success: true, 
          message: '구독 신청이 완료되었습니다. 이메일을 확인해 주세요.',
          subscribed: false,
          pending: true
        });
      }

      // 이전에 구독 취소한 경우 재활성화
      if (existingSubscriber.status === 'unsubscribed') {
        const { error: updateError } = await supabase
          .from('subscribers')
          .update({ 
            status: 'pending',
            name: name || null,
            verification_token: crypto.randomUUID(), // 새 토큰 생성
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscriber.id);

        if (updateError) {
          console.error('구독자 업데이트 오류:', updateError);
          return res.status(500).json({ success: false, message: '구독 처리 중 오류가 발생했습니다.' });
        }

        // 새 토큰으로 이메일 재발송 - 이메일 전송 활성화
        const { data: updatedSubscriber } = await supabase
          .from('subscribers')
          .select('verification_token')
          .eq('id', existingSubscriber.id)
          .single();

        const verificationUrl = `${BASE_URL}/verify-subscription/${updatedSubscriber!.verification_token}`;
        
        try {
          console.log('이메일 전송 시도:', {
            to: email,
            subject: 'AI 트렌드 파인더 구독 확인',
            verificationUrl
          });
          
          // 이메일 전송 활성화
          await sendEmail(
            email,
            'AI 트렌드 파인더 구독 확인',
            emailTemplates.verification(name || '', verificationUrl)
          );
        } catch (emailError) {
          console.error('확인 이메일 발송 실패:', emailError);
        }

        return res.status(200).json({ 
          success: true, 
          message: '구독 신청이 완료되었습니다. 이메일을 확인해 주세요.',
          subscribed: false,
          pending: true
        });
      }
    }

    // 새 구독자 추가
    const verificationToken = crypto.randomUUID();
    
    const { error: insertError } = await supabase
      .from('subscribers')
      .insert([
        { 
          email, 
          name: name || null,
          status: 'pending',
          verification_token: verificationToken
        }
      ]);

    if (insertError) {
      console.error('구독자 추가 오류:', insertError);
      return res.status(500).json({ success: false, message: '구독 처리 중 오류가 발생했습니다.' });
    }

    // 확인 이메일 발송 - 이메일 전송 활성화
    const verificationUrl = `${BASE_URL}/verify-subscription/${verificationToken}`;
    
    try {
      console.log('이메일 전송 시도:', {
        to: email,
        subject: 'AI 트렌드 파인더 구독 확인',
        verificationUrl
      });
      
      // 이메일 전송 활성화
      await sendEmail(
        email,
        'AI 트렌드 파인더 구독 확인',
        emailTemplates.verification(name || '', verificationUrl)
      );
    } catch (emailError) {
      console.error('확인 이메일 발송 실패:', emailError);
    }

    return res.status(200).json({ 
      success: true, 
      message: '구독 신청이 완료되었습니다. 이메일을 확인해 주세요.',
      subscribed: false,
      pending: true
    });
  } catch (error) {
    console.error('구독 처리 오류:', error);
    return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다. 나중에 다시 시도해 주세요.' });
  }
};

// 구독 확인 처리
export const verifySubscription = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message: '유효하지 않은 요청입니다.' });
    }

    // Supabase 함수 호출로 확인 처리
    const { data, error } = await supabase
      .rpc('verify_subscription', { token })
      .single();

    if (error) {
      console.error('구독 확인 오류:', error);
      return res.status(500).json({ success: false, message: '구독 확인 중 오류가 발생했습니다.' });
    }

    if (data === true) {
      // 이메일 주소 가져오기
      const { data: subscriber, error: subscriberError } = await supabase
        .from('subscribers')
        .select('email, name')
        .eq('verification_token', token)
        .single();
      
      if (!subscriberError && subscriber) {
        // 가입 완료 메일 전송
        try {
          await sendEmail(
            subscriber.email,
            'AI 트렌드 파인더 구독이 완료되었습니다!',
            emailTemplates.welcome(subscriber.name || '', BASE_URL)
          );
        } catch (emailError) {
          console.error('가입 완료 메일 발송 실패:', emailError);
        }
      }
      
      // 구독 확인 성공
      // 성공 페이지로 리다이렉트 (HTML 응답)
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>구독 확인 완료 - AI 트렌드 파인더</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              text-align: center;
            }
            h1 {
              color: #3498db;
            }
            .card {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .button {
              display: inline-block;
              background-color: #3498db;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 4px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>구독이 확인되었습니다!</h1>
          <div class="card">
            <p>AI 트렌드 파인더 블로그를 구독해 주셔서 감사합니다.</p>
            <p>이제 블로그가 업데이트될 때마다 소식을 받아보실 수 있습니다.</p>
            <a href="${BASE_URL}" class="button">블로그로 돌아가기</a>
          </div>
        </body>
        </html>
      `);
    } else {
      // 구독 확인 실패
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>구독 확인 실패 - AI 트렌드 파인더</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              text-align: center;
            }
            h1 {
              color: #e74c3c;
            }
            .card {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .button {
              display: inline-block;
              background-color: #3498db;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 4px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>구독 확인 실패</h1>
          <div class="card">
            <p>유효하지 않거나 만료된 링크입니다.</p>
            <p>다시 구독을 신청하시려면 블로그로 돌아가 구독 신청을 해주세요.</p>
            <a href="${BASE_URL}" class="button">블로그로 돌아가기</a>
          </div>
        </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('구독 확인 처리 오류:', error);
    return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다. 나중에 다시 시도해 주세요.' });
  }
};

// 구독 취소 처리
export const unsubscribe = async (req: Request, res: Response) => {
  try {
    const { email, token } = req.params;

    if (!email || !token) {
      return res.status(400).json({ success: false, message: '유효하지 않은 요청입니다.' });
    }

    // Supabase 함수 호출로 구독 취소 처리
    const { data, error } = await supabase
      .rpc('unsubscribe', { email_address: email, token })
      .single();

    if (error) {
      console.error('구독 취소 오류:', error);
      return res.status(500).json({ success: false, message: '구독 취소 중 오류가 발생했습니다.' });
    }

    if (data === true) {
      // 구독 취소 성공
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>구독 취소 완료 - AI 트렌드 파인더</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              text-align: center;
            }
            h1 {
              color: #3498db;
            }
            .card {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .button {
              display: inline-block;
              background-color: #3498db;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 4px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>구독이 취소되었습니다</h1>
          <div class="card">
            <p>AI 트렌드 파인더 블로그 구독이 취소되었습니다.</p>
            <p>언제든지 다시 구독하실 수 있습니다.</p>
            <a href="${BASE_URL}" class="button">블로그로 돌아가기</a>
          </div>
        </body>
        </html>
      `);
    } else {
      // 구독 취소 실패
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>구독 취소 실패 - AI 트렌드 파인더</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              text-align: center;
            }
            h1 {
              color: #e74c3c;
            }
            .card {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .button {
              display: inline-block;
              background-color: #3498db;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 4px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>구독 취소 실패</h1>
          <div class="card">
            <p>유효하지 않은 요청입니다.</p>
            <p>구독 취소에 문제가 있다면 관리자에게 문의해주세요.</p>
            <a href="${BASE_URL}" class="button">블로그로 돌아가기</a>
          </div>
        </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('구독 취소 처리 오류:', error);
    return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다. 나중에 다시 시도해 주세요.' });
  }
};

// 블로그 업데이트 알림 이메일 발송
export const sendBlogUpdateNotifications = async (req: Request, res: Response) => {
  try {
    // 관리자 권한 확인 (적절한 인증 로직 구현 필요)
    // 간단한 예시로 API 키 체크
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.NOTIFICATION_API_KEY) {
      return res.status(401).json({ success: false, message: '인증되지 않은 요청입니다.' });
    }

    const { posts } = req.body;

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({ success: false, message: '유효한 포스트 데이터가 필요합니다.' });
    }

    // 활성 구독자 조회
    const { data: subscribers, error: subscribersError } = await supabase
      .from('subscribers')
      .select('id, email, name, verification_token')
      .eq('status', 'active');

    if (subscribersError) {
      console.error('구독자 조회 오류:', subscribersError);
      return res.status(500).json({ success: false, message: '구독자 조회 중 오류가 발생했습니다.' });
    }

    if (!subscribers || subscribers.length === 0) {
      return res.status(200).json({ success: true, message: '발송할 구독자가 없습니다.', sent: 0 });
    }

    // 알림 이메일 발송
    let sentCount = 0;
    const errors = [];

    for (const subscriber of subscribers) {
      try {
        const unsubscribeUrl = `${BASE_URL}/unsubscribe/${subscriber.email}/${subscriber.verification_token}`;
        
        await sendEmail(
          subscriber.email,
          'AI 트렌드 파인더 최신 업데이트',
          emailTemplates.blogUpdate(subscriber.name || '', posts, unsubscribeUrl)
        );

        // 마지막 알림 발송 시간 업데이트
        await supabase
          .from('subscribers')
          .update({ last_notification_sent_at: new Date().toISOString() })
          .eq('id', subscriber.id);

        sentCount++;
      } catch (error) {
        console.error(`구독자 ${subscriber.email}에게 이메일 발송 실패:`, error);
        errors.push({ email: subscriber.email, error: (error as Error).message });
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `${sentCount}명의 구독자에게 업데이트 알림을 발송했습니다.`,
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('업데이트 알림 발송 오류:', error);
    return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
}; 