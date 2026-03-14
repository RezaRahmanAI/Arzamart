using System;
using System.Collections.Generic;
using ECommerce.Core.Entities;
using ECommerce.Core.DTOs;
using AutoMapper;
using ECommerce.API.Helpers;

public class TestMap {
    public static void Run() {
        try {
            var config = new MapperConfiguration(cfg => {
                cfg.AddProfile<MappingProfiles>();
            }, new Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory());
            var mapper = config.CreateMapper();

            var order = new Order {
                Id = 1,
                Items = new List<OrderItem> {
                    new OrderItem {
                        ProductId = 1,
                        Product = new Product { Id = 1, Name = "Test" }
                    }
                }
            };
            
            var dto = mapper.Map<Order, OrderDto>(order);
            Console.WriteLine("SUCCESS!");
        } catch (Exception ex) {
            Console.WriteLine("ERROR: " + ex.ToString());
        }
    }
}