package io.liveoak.container.service.bootstrap;

import java.io.File;

import io.liveoak.container.tenancy.GlobalContext;
import io.liveoak.container.tenancy.InternalApplicationRegistry;
import io.liveoak.container.tenancy.service.ApplicationRegistryService;
import io.liveoak.container.tenancy.service.ApplicationsDeployerService;
import io.liveoak.container.tenancy.service.ApplicationsDirectoryService;
import org.jboss.msc.inject.Injector;
import org.jboss.msc.service.Service;
import org.jboss.msc.service.ServiceTarget;
import org.jboss.msc.service.StartContext;
import org.jboss.msc.service.StartException;
import org.jboss.msc.service.StopContext;
import org.jboss.msc.service.ValueService;
import org.jboss.msc.value.ImmediateValue;
import org.jboss.msc.value.InjectedValue;

import static io.liveoak.spi.Services.APPLICATIONS_DEPLOYER;
import static io.liveoak.spi.Services.APPLICATIONS_DIR;
import static io.liveoak.spi.Services.APPLICATION_REGISTRY;
import static io.liveoak.spi.Services.GLOBAL_CONTEXT;

/**
 * @author Bob McWhirter
 */
public class TenancyBootstrappingService implements Service<Void> {
    @Override
    public void start(StartContext context) throws StartException {
        ServiceTarget target = context.getChildTarget();

        target.addService(APPLICATIONS_DIR, new ApplicationsDirectoryService(new File(this.applicationsDirectoryInjector.getValue()).getAbsoluteFile()))
                .install();

        target.addService(APPLICATION_REGISTRY, new ApplicationRegistryService())
                .install();

        ApplicationsDeployerService deployerService = new ApplicationsDeployerService();
        target.addService(APPLICATIONS_DEPLOYER, deployerService)
                .addDependency(APPLICATIONS_DIR, File.class, deployerService.applicationsDirectoryInjector())
                .addDependency(APPLICATION_REGISTRY, InternalApplicationRegistry.class, deployerService.applicationRegistryInjector())
                .install();

        Service<GlobalContext> globalContext = new ValueService<GlobalContext>(new ImmediateValue<>(new GlobalContext()));
        target.addService(GLOBAL_CONTEXT, globalContext)
                .install();
    }

    @Override
    public void stop(StopContext context) {

    }

    @Override
    public Void getValue() throws IllegalStateException, IllegalArgumentException {
        return null;
    }

    public Injector<String> applicationsDirectoryInjector() {
        return this.applicationsDirectoryInjector;
    }

    private InjectedValue<String> applicationsDirectoryInjector = new InjectedValue<>();
}
