package com.crimecat.backend.coupon;

import com.crimecat.backend.coupon.domain.Coupon;
import com.crimecat.backend.coupon.dto.CouponCreateRequestDto;
import com.crimecat.backend.coupon.dto.CouponRedeemRequestDto;
import com.crimecat.backend.coupon.repository.CouponRepository;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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

        mockMvc.perform(post("/v1/bot/coupons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("created successfully"))
                .andExpect(jsonPath("$.innerDto").isArray())
                .andExpect(jsonPath("$.innerDto.length()").value(3));
    }

    @Test
    void 쿠폰_등록_성공_실패() throws Exception {
        // 준비: 유저 & 쿠폰 저장
        String snowflake = String.valueOf(ThreadLocalRandom.current().nextInt(10000000, 100000000));
        User user = userRepository.save(User.of(snowflake,"test","url"));
        Coupon coupon = couponRepository.save(Coupon.create(5000, 14));

        CouponRedeemRequestDto dto = new CouponRedeemRequestDto(user.getSnowflake(), coupon.getId().toString());

        mockMvc.perform(patch("/v1/bot/coupons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Coupon redeemed successfully"))
                .andExpect(jsonPath("$.point").value(5000));
        mockMvc.perform(patch("/v1/bot/coupons")
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

        mockMvc.perform(patch("/v1/bot/coupons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("유효한 코드가 아닙니다."));
    }

    @Test
    void 쿠폰_등록_실패_없는유저() throws Exception {
        Coupon coupon = couponRepository.save(Coupon.create(1000, 7));

        CouponRedeemRequestDto dto = new CouponRedeemRequestDto("999999999999", coupon.getId().toString());

        mockMvc.perform(patch("/v1/bot/coupons")
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
        mockMvc.perform(patch("/v1/bot/coupons")
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
        mockMvc.perform(patch("/v1/bot/coupons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userSnowflakeDtoNull)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("유저 정보가 없습니다."));
        //codId null
        CouponRedeemRequestDto codeDtoNull = new CouponRedeemRequestDto(snowflake, null);
        mockMvc.perform(patch("/v1/bot/coupons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(codeDtoNull)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("유효한 코드가 아닙니다."));
        //allNull
        CouponRedeemRequestDto allDtoNull = new CouponRedeemRequestDto(null, null);
        mockMvc.perform(patch("/v1/bot/coupons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(allDtoNull)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("유저 정보가 없습니다."));
    }
}
