package ch.xxx.messenger;

import java.io.IOException;

import javax.servlet.FilterConfig;
import javax.servlet.ServletException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.tuckey.web.filters.urlrewrite.Conf;
import org.tuckey.web.filters.urlrewrite.UrlRewriteFilter;

@Component
public class MyUrlRewriteFilter extends UrlRewriteFilter {

	private static final String CONFIG_LOCATION = "classpath:/urlrewrite.xml";

	@Value(CONFIG_LOCATION)
	private Resource resource;

	@Override
	protected void loadUrlRewriter(FilterConfig filterConfig) throws ServletException {
		try {
			Conf conf = new Conf(filterConfig.getServletContext(), resource.getInputStream(), resource.getFilename(), "");
			checkConf(conf);
		} catch (IOException ex) {
			throw new ServletException("Unable to load URL-rewrite configuration file from " + CONFIG_LOCATION, ex);
		}
	}
}
