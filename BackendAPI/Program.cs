using System.Text;
using BackendAPI.Core.Repository;
using BackendAPI.Core.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Activate standard API Controller architectures
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Services required for Swagger UI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 1. Data Access Layer Registration (DAL)
builder.Services.AddSingleton<IDbConnectionFactory, DbConnectionFactory>();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
options.UseSqlServer(
    builder.Configuration.GetConnectionString("DefaultConnection"),
    // The free Azure SQL database auto-pauses when idle and needs up to a minute to
    // resume. Retrying lets the app wait for it instead of crashing at startup.
    sql => sql.EnableRetryOnFailure(
        maxRetryCount: 10,
        maxRetryDelay: TimeSpan.FromSeconds(30),
        errorNumbersToAdd: null)));
builder.Services.AddScoped<IAiMatchingRepository, AiMatchingRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>(); // User CRUD Core Injection
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IResumeRepository, ResumeRepository>();
builder.Services.AddScoped<IJobRepository, JobRepository>();
builder.Services.AddScoped<IApplicationRepository, ApplicationRepository>();
builder.Services.AddScoped<IInterviewRepository, InterviewRepository>();
builder.Services.AddScoped<ISkillRepository, SkillRepository>();
builder.Services.AddScoped<ICandidateProfileRepository, CandidateProfileRepository>();
builder.Services.AddScoped<IInterviewStatusRepository, InterviewStatusRepository>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IConsentLogRepository, ConsentLogRepository>();
builder.Services.AddScoped<IConsentService, ConsentService>();
builder.Services.AddHttpClient<ITurnstileService, TurnstileService>();
builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IOtpService, OtpService>();
builder.Services.AddSingleton<IRateLimitService, RateLimitService>();

// 2. Business Logic Layer Registration (BLL)
builder.Services.AddScoped<IAiMatchingService, AiMatchingService>();
builder.Services.AddScoped<IUserService, UserService>(); // User Mapping Service Injection
builder.Services.AddScoped<IAuthService, AuthService>(); // Login Service Injection
builder.Services.AddScoped<ICandidateRepository, CandidateRepository>();
builder.Services.AddScoped<IRecruiterRepository, RecruiterRepository>();
builder.Services.AddScoped<IResumeService, ResumeService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IJobService, JobService>();
builder.Services.AddScoped<IApplicationService, ApplicationService>();
builder.Services.AddScoped<IInterviewService, InterviewService>();

// 2b. Python AiService Client Registration
builder.Services.AddHttpClient<IAiServiceClient, AiServiceClient>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["AiService:BaseUrl"] ?? "http://localhost:8000");

    // Shared secret for the AI service. Sent only when configured, so local dev needs nothing.
    var aiServiceKey = builder.Configuration["AiService:ApiKey"];
    if (!string.IsNullOrEmpty(aiServiceKey))
    {
        client.DefaultRequestHeaders.Add("X-API-Key", aiServiceKey);
    }
    client.Timeout = TimeSpan.FromSeconds(120);
});

// 3. JWT Authentication Setup
var jwtKey = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

// 4. Register CORS Policies for your Frontend Workspace
// Allowed browser origins. Local defaults; in Azure set Cors__AllowedOrigins (comma-separated).
var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? "http://localhost:5173,http://localhost:3000")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
options.AddPolicy("AllowFrontendWorkspace", policy =>
    {
policy.WithOrigins(allowedOrigins) // Vite / Create React App default ports
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Auto-apply any pending EF Core migrations every time the app starts.
// This checks the __EFMigrationsHistory table in the database, compares it
// against the Migrations folder, and runs only whatever hasn't been applied
// yet — so a plain `dotnet run` always leaves the schema up to date.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
app.MapOpenApi();
app.UseSwagger();
app.UseSwaggerUI();
}

// Only use HTTPS redirection outside local sandbox development to avoid port mismatch warnings
if (!app.Environment.IsDevelopment())
{
app.UseHttpsRedirection();
}

// Execute CORS policy rules right before routing endpoints
app.UseCors("AllowFrontendWorkspace");

app.UseAuthentication();
app.UseAuthorization();

// Route processing targets down to individual controllers
app.MapControllers();

app.Run();