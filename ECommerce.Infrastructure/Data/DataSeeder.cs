using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using ECommerce.Core.Entities;
using ECommerce.Core.Entities.Location;
using ECommerce.Core.Entities.Shop;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace ECommerce.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, ApplicationDbContext context, ILoggerFactory? loggerFactory = null)
    {
        var logger = loggerFactory?.CreateLogger(nameof(DataSeeder));

        try
        {
            // Seed Locations (Divisions, Districts, Upazilas)
            if (!await context.Divisions.AnyAsync())
            {
                await SeedLocationsAsync(context);
            }

            // Seed Delivery Zones
            if (!await context.DeliveryZones.AnyAsync())
            {
                await SeedDeliveryZonesAsync(context);
            }

            // Migrate kids category to children category if it exists
            var kidsCategory = await context.Categories.FirstOrDefaultAsync(c => c.Slug == "kids");
            if (kidsCategory != null)
            {
                kidsCategory.Name = "Children";
                kidsCategory.Slug = "children";
                await context.SaveChangesAsync();
            }

            // 0. Seed Initial Categories
            if (!await context.Categories.AnyAsync())
            {
                var categories = new List<Category>
                {
                    new Category { Name = "Men", Slug = "men", DisplayOrder = 1, IsActive = true },
                    new Category { Name = "Women", Slug = "women", DisplayOrder = 2, IsActive = true },
                    new Category { Name = "Children", Slug = "children", DisplayOrder = 3, IsActive = true },
                    new Category { Name = "Accessories", Slug = "accessories", DisplayOrder = 4, IsActive = true }
                };

                context.Categories.AddRange(categories);
                await context.SaveChangesAsync();
            }

            // 1. Ensure Roles Exist
            if (!await roleManager.RoleExistsAsync("SuperAdmin"))
            {
                await roleManager.CreateAsync(new IdentityRole("SuperAdmin"));
            }

            if (!await roleManager.RoleExistsAsync("Admin"))
            {
                await roleManager.CreateAsync(new IdentityRole("Admin"));
            }

            if (!await roleManager.RoleExistsAsync("Customer"))
            {
                await roleManager.CreateAsync(new IdentityRole("Customer"));
            }

            if (!await roleManager.RoleExistsAsync("Staff"))
            {
                await roleManager.CreateAsync(new IdentityRole("Staff"));
            }

            // 2. Ensure Super Admin User exists
            var adminEmail = "admin@arzamart.com";
            var existingAdmin = await userManager.FindByEmailAsync(adminEmail);

            if (existingAdmin == null)
            {
                var newPassword = Guid.NewGuid().ToString("N")[..12] + "!A1";
                var newAdmin = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    FullName = "Arza Super Admin",
                    EmailConfirmed = true,
                    Role = "SuperAdmin",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    ForceChangePassword = true
                };

                var result = await userManager.CreateAsync(newAdmin, newPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(newAdmin, "SuperAdmin");
                    logger?.LogCritical("ADMIN ACCOUNT CREATED — Email: {Email} | Password: {Password} | CHANGE THIS PASSWORD IMMEDIATELY", adminEmail, newPassword);
                }
                else
                {
                    logger?.LogError("Failed to create admin account: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }
            else
            {
                // Update existing admin to SuperAdmin if needed
                if (existingAdmin.Role != "SuperAdmin")
                {
                    existingAdmin.Role = "SuperAdmin";
                    await userManager.UpdateAsync(existingAdmin);

                    // Add to identity role too
                    if (!await userManager.IsInRoleAsync(existingAdmin, "SuperAdmin"))
                    {
                        await userManager.AddToRoleAsync(existingAdmin, "SuperAdmin");
                    }
                }
            }

            // Link existing DeliveryMethods to DeliveryZones (runs every startup)
            var zInside = await context.DeliveryZones.FirstOrDefaultAsync(z => z.Name == "Inside Dhaka");
            var zOutside = await context.DeliveryZones.FirstOrDefaultAsync(z => z.Name == "Outside Dhaka");

            if (zInside != null)
            {
                var insideMethod = await context.DeliveryMethods
                    .FirstOrDefaultAsync(m => m.Name.Contains("Inside Dhaka") && m.DeliveryZoneId == null);
                if (insideMethod != null)
                {
                    insideMethod.DeliveryZoneId = zInside.Id;
                }
            }

            if (zOutside != null)
            {
                var outsideMethod = await context.DeliveryMethods
                    .FirstOrDefaultAsync(m => m.Name.Contains("Outside Dhaka") && m.DeliveryZoneId == null);
                if (outsideMethod != null)
                {
                    outsideMethod.DeliveryZoneId = zOutside.Id;
                }

                var subMethod = await context.DeliveryMethods
                    .FirstOrDefaultAsync(m => (m.Name.Contains("Sub") || m.Name.Contains("Outside")) && m.DeliveryZoneId == null);
                if (subMethod != null)
                {
                    subMethod.DeliveryZoneId = zOutside.Id;
                }
            }

            await context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "An error occurred during database seeding");
        }
    }

    private static async Task SeedLocationsAsync(ApplicationDbContext context)
    {
        var divisions = new List<Division>
        {
            new() { NameEn = "Dhaka", NameBn = "ঢাকা", BdGovtCode = "10", DisplayOrder = 1, IsActive = true },
            new() { NameEn = "Chittagong", NameBn = "চট্টগ্রাম", BdGovtCode = "20", DisplayOrder = 2, IsActive = true },
            new() { NameEn = "Barisal", NameBn = "বরিশাল", BdGovtCode = "30", DisplayOrder = 6, IsActive = true },
            new() { NameEn = "Khulna", NameBn = "খুলনা", BdGovtCode = "40", DisplayOrder = 5, IsActive = true },
            new() { NameEn = "Rajshahi", NameBn = "রাজশাহী", BdGovtCode = "50", DisplayOrder = 3, IsActive = true },
            new() { NameEn = "Rangpur", NameBn = "রংপুর", BdGovtCode = "55", DisplayOrder = 7, IsActive = true },
            new() { NameEn = "Sylhet", NameBn = "সিলেট", BdGovtCode = "60", DisplayOrder = 4, IsActive = true },
            new() { NameEn = "Mymensingh", NameBn = "ময়মনসিংহ", BdGovtCode = "15", DisplayOrder = 8, IsActive = true }
        };

        context.Divisions.AddRange(divisions);
        await context.SaveChangesAsync();

        // Districts per division
        var districtData = new Dictionary<string, (int divIdx, string[] districts)>
        {
            ["Dhaka"] = (0, new[] { "Dhaka", "Gazipur", "Narayanganj", "Tangail", "Faridpur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narsingdi", "Rajbari", "Shariatpur" }),
            ["Chittagong"] = (1, new[] { "Chittagong", "Cox's Bazar", "Bandarban", "Khagrachhari", "Rangamati", "Comilla", "Chandpur", "Feni", "Lakshmipur", "Noakhali", "Brahmanbaria" }),
            ["Barisal"] = (2, new[] { "Barisal", "Patuakhali", "Bhola", "Pirojpur", "Jhalokati", "Barguna" }),
            ["Khulna"] = (3, new[] { "Khulna", "Bagerhat", "Satkhira", "Jessore", "Kushtia", "Chuadanga", "Meherpur", "Magura", "Narail", "Jhenaidah" }),
            ["Rajshahi"] = (4, new[] { "Rajshahi", "Bogura", "Joypurhat", "Naogaon", "Natore", "Chapainawabganj", "Pabna", "Sirajganj" }),
            ["Rangpur"] = (5, new[] { "Rangpur", "Dinajpur", "Kurigram", "Lalmonirhat", "Gaibandha", "Nilphamari", "Thakurgaon", "Panchagarh" }),
            ["Sylhet"] = (6, new[] { "Sylhet", "Habiganj", "Moulvibazar", "Sunamganj" }),
            ["Mymensingh"] = (7, new[] { "Mymensingh", "Netrokona", "Sherpur", "Jamalpur" })
        };

        var banglaDistrictNames = new Dictionary<string, string>
        {
            ["Dhaka"] = "ঢাকা", ["Gazipur"] = "গাজীপুর", ["Narayanganj"] = "নারায়ণগঞ্জ",
            ["Tangail"] = "টাঙ্গাইল", ["Faridpur"] = "ফরিদপুর", ["Gopalganj"] = "গোপালগঞ্জ",
            ["Kishoreganj"] = "কিশোরগঞ্জ", ["Madaripur"] = "মাদারীপুর", ["Manikganj"] = "মানিকগঞ্জ",
            ["Munshiganj"] = "মুন্সীগঞ্জ", ["Narsingdi"] = "নরসিংদী", ["Rajbari"] = "রাজবাড়ী",
            ["Shariatpur"] = "শরীয়তপুর", ["Chittagong"] = "চট্টগ্রাম", ["Cox's Bazar"] = "কক্সবাজার",
            ["Bandarban"] = "বান্দরবান", ["Khagrachhari"] = "খাগড়াছড়ি", ["Rangamati"] = "রাঙ্গামাটি",
            ["Comilla"] = "কুমিল্লা", ["Chandpur"] = "চাঁদপুর", ["Feni"] = "ফেনী",
            ["Lakshmipur"] = "লক্ষ্মীপুর", ["Noakhali"] = "নোয়াখালী", ["Brahmanbaria"] = "ব্রাহ্মণবাড়িয়া",
            ["Barisal"] = "বরিশাল", ["Patuakhali"] = "পটুয়াখালী", ["Bhola"] = "ভোলা",
            ["Pirojpur"] = "পিরোজপুর", ["Jhalokati"] = "ঝালকাঠি", ["Barguna"] = "বরগুনা",
            ["Khulna"] = "খুলনা", ["Bagerhat"] = "বাগেরহাট", ["Satkhira"] = "সাতক্ষীরা",
            ["Jessore"] = "যশোর", ["Kushtia"] = "কুষ্টিয়া", ["Chuadanga"] = "চুয়াডাঙ্গা",
            ["Meherpur"] = "মেহেরপুর", ["Magura"] = "মাগুরা", ["Narail"] = "নড়াইল",
            ["Jhenaidah"] = "ঝিনাইদহ", ["Rajshahi"] = "রাজশাহী", ["Bogura"] = "বগুড়া",
            ["Joypurhat"] = "জয়পুরহাট", ["Naogaon"] = "নওগাঁ", ["Natore"] = "নাটোর",
            ["Chapainawabganj"] = "চাঁপাইনবাবগঞ্জ", ["Pabna"] = "পাবনা", ["Sirajganj"] = "সিরাজগঞ্জ",
            ["Rangpur"] = "রংপুর", ["Dinajpur"] = "দিনাজপুর", ["Kurigram"] = "কুড়িগ্রাম",
            ["Lalmonirhat"] = "লালমনিরহাট", ["Gaibandha"] = "গাইবান্ধা", ["Nilphamari"] = "নীলফামারী",
            ["Thakurgaon"] = "ঠাকুরগাঁও", ["Panchagarh"] = "পঞ্চগড়", ["Sylhet"] = "সিলেট",
            ["Habiganj"] = "হবিগঞ্জ", ["Moulvibazar"] = "মৌলভীবাজার", ["Sunamganj"] = "সুনামগঞ্জ",
            ["Mymensingh"] = "ময়মনসিংহ", ["Netrokona"] = "নেত্রকোণা", ["Sherpur"] = "শেরপুর",
            ["Jamalpur"] = "জামালপুর"
        };

        var allDistricts = new List<District>();
        foreach (var kvp in districtData)
        {
            var div = divisions[kvp.Value.divIdx];
            int order = 1;
            foreach (var distName in kvp.Value.districts)
            {
                allDistricts.Add(new District
                {
                    NameEn = distName,
                    NameBn = banglaDistrictNames.GetValueOrDefault(distName, distName),
                    DisplayOrder = order++,
                    IsActive = true,
                    DivisionId = div.Id
                });
            }
        }

        context.Districts.AddRange(allDistricts);
        await context.SaveChangesAsync();

        // Upazilas / Areas mapped to districts
        var upazilaData = new Dictionary<string, string[]>
        {
            ["Dhaka"] = new[] { "Adabor", "Ashulia", "Azimpur", "Badda", "Banani", "Banglamotor", "Banasree", "Baridhara", "Basundhara", "Cantonment", "Chaukbazar", "Demra", "Dhanmondi", "Dohar", "Eskaton", "Farmgate", "Gulshan", "Hazaribagh", "Jatrabari", "Kafrul", "Kalabagan", "Kamrangirchar", "Keraniganj", "Khilgaon", "Khilkhet", "Kotwali", "Lalbagh", "Mirpur", "Mohammadpur", "Motijheel", "New Market", "Pallabi", "Paltan", "Ramna", "Rampura", "Sabujbagh", "Savar", "Shahbagh", "Sher-e-Bangla Nagar", "Shyamoli", "Sutrapur", "Tejgaon", "Uttara", "Vatara", "Wari" },
            ["Chittagong"] = new[] { "Agrabad", "Akbarshah", "Bakalia", "Bandar", "Bayazid", "Chandgaon", "Chatteshwari", "Chawkbazar", "Cornish", "Dampara", "Double Mooring", "EPZ", "Halishahar", "Hathazari", "Ispahani", "Jalalabad", "Jhautala", "Karnaphuli", "Kattali", "Khulshi", "Mirsharai", "Mohra", "Nasirabad", "Pahartali", "Panchlaish", "Patenga", "Rampur", "Sadarghat", "Sitakunda" },
            ["Gazipur"] = new[] { "Kaliakair", "Kaliganj", "Kapasia", "Sreepur", "Tongi", "Sadar" },
            ["Narayanganj"] = new[] { "Araihazar", "Bandar", "Fatullah", "Rupganj", "Siddhirganj" },
            ["Tangail"] = new[] { "Basail", "Bhuapur", "Delduar", "Ghatail", "Gopalpur", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur" },
            ["Mymensingh"] = new[] { "Bhaluka", "Fulbaria", "Gaforgaon", "Gouripur", "Haluaghat", "Ishwarganj", "Muktagachha", "Nandail", "Phulpur", "Trishal", "Sadar", "Dhobaura" },
            ["Comilla"] = new[] { "Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Daudkandi", "Debidwar", "Homna", "Laksam", "Muradnagar", "Nangalkot", "Sadar", "Sadar South", "Titas" },
            ["Sylhet"] = new[] { "Balaganj", "Beanibazar", "Bishwanath", "Companiganj", "Dakshin Surma", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat" },
            ["Rajshahi"] = new[] { "Bagha", "Bagmara", "Charghat", "Durgapur", "Godagari", "Mohanpur", "Paba", "Puthia", "Tanore", "Sadar" },
            ["Bogura"] = new[] { "Adamdighi", "Dhunat", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur", "Sherpur", "Shibganj", "Sadar" },
            ["Khulna"] = new[] { "Batiaghata", "Dacope", "Dighalia", "Dumuria", "Koyra", "Paikgachha", "Phultala", "Rupsha", "Terokhada", "Sadar" },
            ["Barisal"] = new[] { "Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Gournadi", "Hizla", "Mehendiganj", "Muladi", "Wazirpur", "Sadar" },
            ["Rangpur"] = new[] { "Badarganj", "Gangachara", "Kaunia", "Mithapukur", "Pirgachha", "Pirganj", "Taraganj", "Sadar" },
            ["Dinajpur"] = new[] { "Birampur", "Birganj", "Biral", "Bochaganj", "Chirirbandar", "Phulbari", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Nawabganj", "Parbatipur", "Sadar" },
            ["Noakhali"] = new[] { "Begumganj", "Chatkhil", "Companyganj", "Hatiya", "Kabirhat", "Senbagh", "Sadar" },
            ["Feni"] = new[] { "Chhagalnaiya", "Daganbhuiyan", "Fulgazi", "Parshuram", "Sonagazi" },
            ["Brahmanbaria"] = new[] { "Akhaura", "Bancharampur", "Bijoynagar", "Kasba", "Nabinagar", "Nasirnagar", "Sarail" },
            ["Pabna"] = new[] { "Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Ishwardi", "Santhia", "Sujanagar", "Sadar" },
            ["Kushtia"] = new[] { "Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Mirpur", "Sadar" },
            ["Jessore"] = new[] { "Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Keshabpur", "Manirampur", "Sharsha", "Sadar" },
            ["Bagerhat"] = new[] { "Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola", "Sadar" },
            ["Satkhira"] = new[] { "Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Shyamnagar", "Tala", "Sadar" },
            ["Cox's Bazar"] = new[] { "Chakaria", "Kutubdia", "Maheshkhali", "Pekua", "Ramu", "Teknaf", "Ukhia", "Sadar" },
            ["Habiganj"] = new[] { "Ajmiriganj", "Bahubal", "Baniachong", "Chunarughat", "Lakhai", "Madhabpur", "Nabiganj", "Sadar" },
            ["Moulvibazar"] = new[] { "Barlekha", "Juri", "Kamalganj", "Kulaura", "Rajnagar", "Sreemangal", "Sadar" },
            ["Lakshmipur"] = new[] { "Kamalnagar", "Ramganj", "Ramgati", "Raypur", "Sadar" },
            ["Narsingdi"] = new[] { "Belabo", "Monohardi", "Palash", "Raipura", "Shibpur", "Sadar" },
            ["Munshiganj"] = new[] { "Gajaria", "Lohajang", "Sirajdikhan", "Sreenagar", "Tongibari", "Sadar" },
            ["Manikganj"] = new[] { "Daulatpur", "Ghior", "Harirampur", "Saturia", "Shibalaya", "Singair", "Sadar" },
            ["Kishoreganj"] = new[] { "Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj", "Katiadi", "Kuliarchar", "Mithamain", "Nikli", "Pakundia", "Tarail", "Sadar" },
            ["Rajbari"] = new[] { "Baliakandi", "Goalandaghat", "Pangsha", "Kalukhali", "Sadar" },
            ["Faridpur"] = new[] { "Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan", "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha", "Sadar" },
            ["Madaripur"] = new[] { "Kalkini", "Rajoir", "Shibchar", "Sadar" },
            ["Shariatpur"] = new[] { "Bhedarganj", "Damudya", "Gosairhat", "Naria", "Zanjira", "Sadar" },
            ["Gopalganj"] = new[] { "Kashiani", "Kotalipara", "Muksudpur", "Tungipara", "Sadar" },
            ["Netrokona"] = new[] { "Atpara", "Barhatta", "Durgapur", "Kalmakanda", "Kendua", "Khaliajuri", "Madan", "Mohanganj", "Purbadhala", "Sadar" },
            ["Sherpur"] = new[] { "Jhenaigati", "Nalitabari", "Nakla", "Sreebardi", "Sadar" },
            ["Jamalpur"] = new[] { "Bakshiganj", "Dewanganj", "Islampur", "Madarganj", "Melandaha", "Sarishabari", "Sadar" },
            ["Sunamganj"] = new[] { "Bishwamvarpur", "Chhatak", "Dakshin Sunamganj", "Derai", "Dowarabazar", "Jagannathpur", "Jamalganj", "Sullah", "Tahirpur", "Sadar" },
            ["Chuadanga"] = new[] { "Alamdanga", "Damurhuda", "Jibannagar", "Sadar" },
            ["Meherpur"] = new[] { "Gangni", "Mujibnagar", "Sadar" },
            ["Magura"] = new[] { "Mohammadpur", "Shalikha", "Sreepur", "Sadar" },
            ["Narail"] = new[] { "Kalia", "Lohagara", "Sadar" },
            ["Jhenaidah"] = new[] { "Harinakunda", "Kotchandpur", "Moheshpur", "Shailkupa", "Kaliganj", "Sadar" },
            ["Nilphamari"] = new[] { "Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Saidpur", "Sadar" },
            ["Kurigram"] = new[] { "Bhurungamari", "Char Rajibpur", "Chilmari", "Phulbari", "Nageshwari", "Rajarhat", "Raomari", "Ulipur", "Sadar" },
            ["Lalmonirhat"] = new[] { "Aditmari", "Hatibandha", "Kaliganj", "Patgram", "Sadar" },
            ["Gaibandha"] = new[] { "Fulchhari", "Gobindaganj", "Palashbari", "Saghata", "Sundarganj", "Sadar", "Polashbari" },
            ["Thakurgaon"] = new[] { "Baliadangi", "Haripur", "Pirganj", "Ranisankail", "Sadar" },
            ["Panchagarh"] = new[] { "Atwari", "Boda", "Debiganj", "Tetulia", "Sadar" },
            ["Sirajganj"] = new[] { "Belkuchi", "Chauhali", "Kamarkhand", "Kazipur", "Raiganj", "Shahjadpur", "Tarash", "Ullahpara", "Sadar" },
            ["Naogaon"] = new[] { "Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Mohadevpur", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar", "Sadar" },
            ["Natore"] = new[] { "Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Naldanga", "Singra" },
            ["Joypurhat"] = new[] { "Akkelpur", "Kalai", "Khetlal", "Panchbibi", "Sadar" },
            ["Chapainawabganj"] = new[] { "Bholahat", "Gomastapur", "Nachol", "Shibganj", "Sadar" },
            ["Patuakhali"] = new[] { "Bauphal", "Dashmina", "Dumki", "Galachipa", "Kalapara", "Mirzaganj", "Sadar" },
            ["Bhola"] = new[] { "Borhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin", "Sadar" },
            ["Pirojpur"] = new[] { "Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad", "Zianagar", "Sadar" },
            ["Jhalokati"] = new[] { "Kathalia", "Nalchity", "Rajapur", "Sadar" },
            ["Barguna"] = new[] { "Amtali", "Bamna", "Betagi", "Patharghata", "Taltali", "Sadar" },
            ["Chandpur"] = new[] { "Faridganj", "Hajiganj", "Haimchar", "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti", "Sadar" },
            ["Khagrachhari"] = new[] { "Dighinala", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh", "Sadar" },
            ["Rangamati"] = new[] { "Bagaichhari", "Barkal", "Belaichhari", "Juraichhari", "Kaptai", "Kawkhali", "Langadu", "Naniyachar", "Rajasthali", "Sadar" },
            ["Bandarban"] = new[] { "Alikadam", "Lama", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi", "Sadar" }
        };

        var allUpazilas = new List<Upazila>();
        foreach (var upazilaKvp in upazilaData)
        {
            var district = allDistricts.FirstOrDefault(d =>
                d.NameEn.Equals(upazilaKvp.Key, StringComparison.OrdinalIgnoreCase));
            if (district == null) continue;

            int order = 1;
            foreach (var upazilaName in upazilaKvp.Value)
            {
                allUpazilas.Add(new Upazila
                {
                    NameEn = upazilaName,
                    NameBn = upazilaName,
                    DisplayOrder = order++,
                    IsActive = true,
                    DistrictId = district.Id
                });
            }
        }

        context.Upazilas.AddRange(allUpazilas);
        await context.SaveChangesAsync();
    }

    private static async Task SeedDeliveryZonesAsync(ApplicationDbContext context)
    {
        // Create Inside Dhaka zone
        var zones = new List<DeliveryZone>
        {
            new() { Name = "Inside Dhaka", Description = "Areas within Dhaka city limits", DisplayOrder = 1, IsActive = true },
            new() { Name = "Outside Dhaka", Description = "Areas outside Dhaka city limits (all other locations)", DisplayOrder = 2, IsActive = true }
        };

        context.DeliveryZones.AddRange(zones);
        await context.SaveChangesAsync();

        // Map upazilas that are considered "Inside Dhaka" (non-outskirt areas)
        var insideDhakaUpazilas = new[] { "Adabor", "Azimpur", "Badda", "Banani", "Banglamotor", "Banasree", "Baridhara", "Basundhara", "Cantonment", "Chaukbazar", "Demra", "Dhanmondi", "Eskaton", "Farmgate", "Gulshan", "Hazaribagh", "Jatrabari", "Kafrul", "Kalabagan", "Kamrangirchar", "Khilgaon", "Khilkhet", "Kotwali", "Lalbagh", "Mirpur", "Mohammadpur", "Motijheel", "New Market", "Pallabi", "Paltan", "Ramna", "Rampura", "Sabujbagh", "Shahbagh", "Sher-e-Bangla Nagar", "Shyamoli", "Sutrapur", "Tejgaon", "Uttara", "Vatara", "Wari" };

        var insideZone = zones[0];
        foreach (var upazilaName in insideDhakaUpazilas)
        {
            var upazila = await context.Upazilas
                .FirstOrDefaultAsync(u => u.NameEn == upazilaName);
            if (upazila != null)
            {
                context.DeliveryZoneUpazilas.Add(new DeliveryZoneUpazila
                {
                    DeliveryZoneId = insideZone.Id,
                    UpazilaId = upazila.Id
                });
            }
        }

        await context.SaveChangesAsync();
    }
}
