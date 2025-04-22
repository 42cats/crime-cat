package com.crimecat.backend.coupon;

import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.crimecat.backend.bot.coupon.domain.Coupon;
import com.crimecat.backend.bot.coupon.dto.CouponCreateRequestDto;
import com.crimecat.backend.bot.coupon.dto.CouponRedeemRequestDto;
import com.crimecat.backend.bot.coupon.repository.CouponRepository;
import com.crimecat.backend.bot.user.domain.User;
import com.crimecat.backend.bot.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local") // application-local.yml 사용
public class CouponApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private CouponRepository couponRepository;
    @Autowired private UserRepository userRepository;

    @Test
    void 쿠폰_생성_성공() throws Exception {
        CouponCreateRequestDto requestDto = new CouponCreateRequestDto(3000, 3, 7);

        mockMvc.perform(post("/bot/v1/coupons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("created successfully"))
                .andExpect(jsonPath("$.coupons").isArray())
                .andExpect(jsonPath("$.coupons.length()").value(3));
    }

    @Test
    void 쿠폰_등록_성공_실패() throws Exception {
        // 준비: 유저 & 쿠폰 저장
        String snowflake = String.valueOf(ThreadLocalRandom.current().nextInt(10000000, 100000000));
        User user = userRepository.save(User.of(snowflake,"test","url"));
        Coupon coupon = couponRepository.save(Coupon.create(5000, 14));

        CouponRedeemRequestDto dto = new CouponRedeemRequestDto(user.getSnowflake(), coupon.getId().toString());

        mockMvc.perform(patch("/bot/v1/coupons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Coupon redeemed successfully"))
                .andExpect(jsonPath("$.point").value(5000));
        mockMvc.perform(patch("/bot/v1/coupons")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("이미 사용된 쿠폰입니다."));
    }

    @Test
    void 쿠폰_등록_실패_없는쿠폰() throws Exception {
        String snowflake = String.valueOf(ThreadLocalRandom.current().nextInt(10000000, 100000000));
        User user = userRepository.save(User.of(snowflake,"sabyun","url"));

        CouponRedeemRequestDto dto = new CouponRedeemRequestDto(user.getSnowflake(), UUID.randomUUID().toString());

        mockMvc.perform(patch("/bot/v1/coupons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("유효한 코드가 아닙니다."));
    }

    @Test
    void 쿠폰_등록_실패_없는유저() throws Exception {
        Coupon coupon = couponRepository.save(Coupon.create(1000, 7));

        CouponRedeemRequestDto dto = new CouponRedeemRequestDto("999999999999", coupon.getId().toString());

        mockMvc.perform(patch("/bot/v1/coupons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("유저 정보가 없습니다."));
    }

    @Test
    void 만료된_쿠폰_사용() throws Exception{
        String snowflake = String.valueOf(ThreadLocalRandom.current().nextInt(10000000, 100000000));
        User user = userRepository.save(User.of(snowflake,"name","url"));
        Coupon coupon = couponRepository.save(Coupon.create(5000,-1));

        CouponRedeemRequestDto dto = new CouponRedeemRequestDto(snowflake,coupon.getId().toString());
        mockMvc.perform(patch("/bot/v1/coupons")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("이미 만료된 쿠폰입니다"));
    }
    @Test
    void 널_바디_체크() throws Exception {
        String snowflake = String.valueOf(ThreadLocalRandom.current().nextInt(10000000, 100000000));
        User user = userRepository.save(User.of(snowflake, "name", "url"));
        Coupon coupon = couponRepository.save(Coupon.create(5000, -1));

        //usersnowfalke null
        CouponRedeemRequestDto userSnowflakeDtoNull = new CouponRedeemRequestDto(null, coupon.getId().toString());
        mockMvc.perform(patch("/bot/v1/coupons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userSnowflakeDtoNull)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("유저 정보가 없습니다."));
        //codId null
        CouponRedeemRequestDto codeDtoNull = new CouponRedeemRequestDto(snowflake, null);
        mockMvc.perform(patch("/bot/v1/coupons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(codeDtoNull)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("유효한 코드가 아닙니다."));
        //allNull
        CouponRedeemRequestDto allDtoNull = new CouponRedeemRequestDto(null, null);
        mockMvc.perform(patch("/bot/v1/coupons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(allDtoNull)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("유저 정보가 없습니다."));
    }

    @Test
    void 쿠폰_동시_등록_테스트() throws Exception {
        Coupon coupon = couponRepository.save(Coupon.create(1000, 7));
        String couponId = coupon.getId().toString();

        int threadCount = 10;
        CountDownLatch latch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0); // ✅ 성공 응답 카운터

        for (int i = 0; i < threadCount; i++) {
            new Thread(() -> {
                try {
                    String snowflake = String.valueOf(ThreadLocalRandom.current().nextInt(10000000, 100000000));
                    User user = userRepository.save(User.of(snowflake, "user" + snowflake, "avatar"));

                    CouponRedeemRequestDto dto = new CouponRedeemRequestDto(user.getSnowflake(), couponId);

                    mockMvc.perform(patch("/bot/v1/coupons")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(dto)))
                            .andDo(result -> {
                                String body = result.getResponse().getContentAsString();
                                System.out.println("Thread response: " + body);
                                if (body.contains("Coupon redeemed successfully")) {
                                    successCount.incrementAndGet();
                                }
                            });

                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    latch.countDown();
                }
            }).start();
        }

        latch.await();

        // ✅ 검증: 단 하나의 성공만 있어야 한다
        assertThat(successCount.get()).isEqualTo(1);

        // ✅ 쿠폰이 실제로 사용되었는지도 검증
        Coupon usedCoupon = couponRepository.findById(UUID.fromString(couponId)).orElseThrow();
        assertThat(usedCoupon.isUsed()).isTrue();
    }

    @AfterEach
    void cleanUp() {
        couponRepository.deleteAll();
        userRepository.deleteAll();
    }
}